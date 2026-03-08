import { Injectable, Logger } from '@nestjs/common';
import type { estypes } from '@elastic/elasticsearch';
import { ElasticsearchService } from 'src/core/infrastructure/persistence/elasticsearch/elasticsearch.service';
import type { IndexMapping } from 'src/core/infrastructure/persistence/elasticsearch/interfaces/index-mapping.interface';
import {
  ProductSearchCriteria,
  ProductSearchDocument,
  ProductSearchFacets,
  ProductSearchHit,
  ProductSearchRepository,
  ProductSearchResult,
  ProductSearchSortField,
  PriceRangeFacetBucket,
} from '../../domain/repositories/product-search-repository.interface';

const PRODUCT_INDEX = 'products';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_VECTOR_DIMS = 384;

const DEFAULT_PRICE_FACET_RANGES: Array<{ key: string; from?: number; to?: number }> = [
  { key: '<250000', to: 250000 },
  { key: '250000-500000', from: 250000, to: 500000 },
  { key: '500000-1000000', from: 500000, to: 1000000 },
  { key: '1000000-2000000', from: 1000000, to: 2000000 },
  { key: '>=2000000', from: 2000000 },
];

type TermBucket = { key: string; doc_count: number };
type PriceRangeBucket = {
  key: string;
  from?: number;
  to?: number;
  doc_count: number;
};
type ProductFacetAggregations = {
  brands?: { buckets?: TermBucket[] };
  grades?: { buckets?: TermBucket[] };
  finishings?: { buckets?: TermBucket[] };
  applicationAreas?: { buckets?: TermBucket[] };
  colors?: { buckets?: TermBucket[] };
  sizeLabels?: { buckets?: TermBucket[] };
  priceRanges?: { buckets?: PriceRangeBucket[] };
};

@Injectable()
export class ElasticsearchProductSearchRepository implements ProductSearchRepository {
  private readonly logger = new Logger(ElasticsearchProductSearchRepository.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) { }

  async ensureIndex(): Promise<void> {
    const mapping: IndexMapping = {
      mappings: {
        dynamic: false,
        properties: {
          id: { type: 'keyword' },
          sku: { type: 'keyword' },
          name: {
            type: 'text',
            fields: { keyword: { type: 'keyword', ignore_above: 256 } },
          },
          description: { type: 'text' },
          brand: {
            type: 'text',
            fields: { keyword: { type: 'keyword', ignore_above: 256 } },
          },
          price: { type: 'double' },
          currency: { type: 'keyword' },
          sizeWidth: { type: 'float' },
          sizeHeight: { type: 'float' },
          sizeThickness: { type: 'float' },
          sizeLabel: { type: 'keyword' },
          grade: { type: 'keyword' },
          finishing: { type: 'keyword' },
          applicationAreas: { type: 'keyword' },
          color: {
            type: 'text',
            fields: { keyword: { type: 'keyword', ignore_above: 256 } },
          },
          pattern: {
            type: 'text',
            fields: { keyword: { type: 'keyword', ignore_above: 256 } },
          },
          antiSlipRating: { type: 'keyword' },
          waterAbsorption: { type: 'keyword' },
          peiRating: { type: 'integer' },
          isOutdoor: { type: 'boolean' },
          frostResistant: { type: 'boolean' },
          status: { type: 'keyword' },
          tilePerBox: { type: 'integer' },
          imageUrl: { type: 'keyword', ignore_above: 2048 },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
          // Default dims allow semantic search without forcing an external mapping file.
          nameVector: {
            type: 'dense_vector',
            dims: DEFAULT_VECTOR_DIMS,
            index: true,
            similarity: 'cosine',
            index_options: { type: 'hnsw' },
          },
        },
      },
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
      },
    };

    await this.elasticsearchService.createIndex(PRODUCT_INDEX, mapping);
  }

  async dropIndex(): Promise<void> {
    await this.elasticsearchService.deleteIndex(PRODUCT_INDEX);
  }

  async index(document: ProductSearchDocument): Promise<void> {
    await this.elasticsearchService.indexDocument(
      PRODUCT_INDEX,
      this.toDocumentRecord(document),
      document.id,
    );
  }

  async update(
    id: string,
    doc: Partial<ProductSearchDocument>,
  ): Promise<void> {
    await this.elasticsearchService.updateDocument(PRODUCT_INDEX, id, doc);
  }

  async delete(id: string): Promise<void> {
    try {
      await this.elasticsearchService.deleteDocument(PRODUCT_INDEX, id);
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 404) {
        return;
      }
      throw error;
    }
  }

  async bulkIndex(documents: ProductSearchDocument[]): Promise<void> {
    await this.elasticsearchService.bulkIndex(
      documents.map((document) => ({
        index: PRODUCT_INDEX,
        id: document.id,
        document: this.toDocumentRecord(document),
      })),
    );
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await this.elasticsearchService.bulkDelete(
      ids.map((id) => ({ index: PRODUCT_INDEX, id })),
    );
  }

  async search(criteria: ProductSearchCriteria): Promise<ProductSearchResult> {
    const page = Math.max(criteria.page ?? DEFAULT_PAGE, 1);
    const limit = Math.min(Math.max(criteria.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const from = (page - 1) * limit;
    const hasTextQuery = Boolean(criteria.query?.trim());
    const hasVectorQuery = Boolean(criteria.queryVector?.length);
    const filter = this.buildFilterClauses(criteria);
    const textQuery = hasTextQuery
      ? this.buildTextQuery(criteria.query!.trim(), filter)
      : filter.length > 0
        ? { bool: { filter } }
        : { match_all: {} };

    const request: estypes.SearchRequest = {
      index: PRODUCT_INDEX,
      from,
      size: limit,
      track_total_hits: true,
      query: textQuery,
      ...(this.shouldApplyExplicitSort(criteria, hasTextQuery, hasVectorQuery)
        ? { sort: this.buildSort(criteria.sortOptions?.sortBy, criteria.sortOptions?.sortOrder) }
        : {}),
      ...(hasTextQuery
        ? {
          highlight: {
            fields: {
              name: {},
              description: {},
            },
          },
        }
        : {}),
      ...(criteria.includeFacets ? { aggs: this.buildFacetAggregations() } : {}),
    };

    if (hasVectorQuery) {
      const k = criteria.knnK ?? limit;
      const numCandidates = criteria.knnNumCandidates ?? Math.max(k * 10, k);
      request.knn = {
        field: 'nameVector',
        query_vector: criteria.queryVector!,
        k,
        num_candidates: numCandidates,
        ...(filter.length > 0 ? { filter: filter.length === 1 ? filter[0] : { bool: { filter } } } : {}),
      };

      if (hasTextQuery) {
        request.rank = { rrf: {} };
      }
    }

    const response = await this.elasticsearchService
      .getClient()
      .search<ProductSearchDocument>(request);

    const total =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : (response.hits.total?.value ?? 0);

    return {
      hits: response.hits.hits.map((hit) => this.mapSearchHit(hit)),
      total,
      page,
      limit,
      took: response.took,
      ...(criteria.includeFacets
        ? { facets: this.mapFacets(response.aggregations as Record<string, unknown> | undefined) }
        : {}),
    };
  }

  async findById(id: string): Promise<ProductSearchDocument | null> {
    const document = await this.elasticsearchService.getDocument<Record<string, unknown>>(
      PRODUCT_INDEX,
      id,
    );

    return document ? (document as unknown as ProductSearchDocument) : null;
  }

  async suggest(prefix: string, limit = 10): Promise<string[]> {
    const result = await this.elasticsearchService.search<ProductSearchDocument>({
      index: PRODUCT_INDEX,
      size: limit,
      _source: ['name'],
      query: {
        match_bool_prefix: {
          name: prefix,
        },
      },
    });

    return [...new Set(result.hits.map((hit) => hit._source.name).filter(Boolean))];
  }

  private buildTextQuery(
    query: string,
    filter: estypes.QueryDslQueryContainer[],
  ): estypes.QueryDslQueryContainer {
    return {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: [
                'sku^6',
                'name^5',
                'brand^3',
                'description^2',
                'color^2',
                'pattern^2',
              ],
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          },
        ],
        ...(filter.length > 0 ? { filter } : {}),
      },
    };
  }

  private buildFilterClauses(
    criteria: ProductSearchCriteria,
  ): estypes.QueryDslQueryContainer[] {
    const filters: estypes.QueryDslQueryContainer[] = [];

    if (criteria.skus?.length) {
      filters.push({ terms: { sku: criteria.skus } });
    }

    if (criteria.brands?.length) {
      filters.push({ terms: { 'brand.keyword': criteria.brands } });
    }

    filters.push({
      terms: { status: criteria.statuses?.length ? criteria.statuses : ['ACTIVE'] },
    });

    if (criteria.grades?.length) {
      filters.push({ terms: { grade: criteria.grades } });
    }

    if (criteria.finishings?.length) {
      filters.push({ terms: { finishing: criteria.finishings } });
    }

    if (criteria.applicationAreas?.length) {
      filters.push({ terms: { applicationAreas: criteria.applicationAreas } });
    }

    if (criteria.colors?.length) {
      filters.push({ terms: { 'color.keyword': criteria.colors } });
    }

    if (criteria.patterns?.length) {
      filters.push({ terms: { 'pattern.keyword': criteria.patterns } });
    }

    if (criteria.antiSlipRatings?.length) {
      filters.push({ terms: { antiSlipRating: criteria.antiSlipRatings } });
    }

    if (criteria.peiRatings?.length) {
      filters.push({ terms: { peiRating: criteria.peiRatings } });
    }

    if (criteria.isOutdoor !== undefined) {
      filters.push({ term: { isOutdoor: criteria.isOutdoor } });
    }

    if (criteria.frostResistant !== undefined) {
      filters.push({ term: { frostResistant: criteria.frostResistant } });
    }

    if (criteria.sizeLabels?.length) {
      filters.push({ terms: { sizeLabel: criteria.sizeLabels } });
    }

    const sizeWidthRange: Record<string, number> = {};
    if (criteria.minWidth !== undefined) sizeWidthRange.gte = criteria.minWidth;
    if (criteria.maxWidth !== undefined) sizeWidthRange.lte = criteria.maxWidth;
    if (Object.keys(sizeWidthRange).length > 0) {
      filters.push({ range: { sizeWidth: sizeWidthRange } });
    }

    const sizeHeightRange: Record<string, number> = {};
    if (criteria.minHeight !== undefined) sizeHeightRange.gte = criteria.minHeight;
    if (criteria.maxHeight !== undefined) sizeHeightRange.lte = criteria.maxHeight;
    if (Object.keys(sizeHeightRange).length > 0) {
      filters.push({ range: { sizeHeight: sizeHeightRange } });
    }

    const priceRange: Record<string, number> = {};
    if (criteria.minPrice !== undefined) priceRange.gte = criteria.minPrice;
    if (criteria.maxPrice !== undefined) priceRange.lte = criteria.maxPrice;
    if (Object.keys(priceRange).length > 0) {
      filters.push({ range: { price: priceRange } });
    }

    return filters;
  }

  private buildSort(
    sortBy: ProductSearchSortField | undefined,
    sortOrder: 'asc' | 'desc' | undefined,
  ): estypes.SortCombinations[] {
    const direction = sortOrder ?? 'desc';
    const field = sortBy ?? 'relevance';

    switch (field) {
      case 'price':
        return [{ price: { order: direction } }];
      case 'createdAt':
        return [{ createdAt: { order: direction } }];
      case 'updatedAt':
        return [{ updatedAt: { order: direction } }];
      case 'name':
        return [{ 'name.keyword': { order: direction, unmapped_type: 'keyword' } }];
      case 'brand':
        return [{ 'brand.keyword': { order: direction, unmapped_type: 'keyword' } }];
      case 'size':
        return [
          { sizeWidth: { order: direction } },
          { sizeHeight: { order: direction } },
        ];
      case 'popularity':
        this.logger.warn('Popularity sort is not indexed yet. Falling back to updatedAt.');
        return [{ updatedAt: { order: direction } }];
      case 'relevance':
      default:
        return [{ _score: { order: 'desc' } }];
    }
  }

  private shouldApplyExplicitSort(
    criteria: ProductSearchCriteria,
    hasTextQuery: boolean,
    hasVectorQuery: boolean,
  ): boolean {
    const sortBy = criteria.sortOptions?.sortBy ?? 'relevance';

    if (sortBy === 'relevance' && (hasTextQuery || hasVectorQuery)) {
      return false;
    }

    if (sortBy === 'relevance' && !hasTextQuery && !hasVectorQuery) {
      return true;
    }

    return true;
  }

  private buildFacetAggregations(): Record<string, estypes.AggregationsAggregationContainer> {
    return {
      brands: { terms: { field: 'brand.keyword', size: 20 } },
      grades: { terms: { field: 'grade', size: 10 } },
      finishings: { terms: { field: 'finishing', size: 10 } },
      applicationAreas: { terms: { field: 'applicationAreas', size: 20 } },
      colors: { terms: { field: 'color.keyword', size: 20 } },
      sizeLabels: { terms: { field: 'sizeLabel', size: 20 } },
      priceRanges: {
        range: {
          field: 'price',
          ranges: DEFAULT_PRICE_FACET_RANGES,
        },
      },
    };
  }

  private mapSearchHit(
    hit: estypes.SearchHit<ProductSearchDocument>,
  ): ProductSearchHit {
    return {
      document: hit._source as ProductSearchDocument,
      score: hit._score ?? null,
      ...(hit.highlight
        ? {
          highlights: {
            ...(hit.highlight.name ? { name: hit.highlight.name as string[] } : {}),
            ...(hit.highlight.description
              ? { description: hit.highlight.description as string[] }
              : {}),
          },
        }
        : {}),
    };
  }

  private mapFacets(
    aggregations?: Record<string, unknown>,
  ): ProductSearchFacets {
    const aggs = (aggregations ?? {}) as ProductFacetAggregations;

    return {
      brands: this.mapTermBuckets(aggs.brands?.buckets),
      grades: this.mapTermBuckets(aggs.grades?.buckets),
      finishings: this.mapTermBuckets(aggs.finishings?.buckets),
      applicationAreas: this.mapTermBuckets(aggs.applicationAreas?.buckets),
      colors: this.mapTermBuckets(aggs.colors?.buckets),
      sizeLabels: this.mapTermBuckets(aggs.sizeLabels?.buckets),
      priceRanges: this.mapPriceRangeBuckets(aggs.priceRanges?.buckets),
    };
  }

  private mapTermBuckets(
    buckets?: TermBucket[],
  ): Array<{ value: string; count: number }> {
    return (buckets ?? []).map((bucket) => ({
      value: String(bucket.key),
      count: bucket.doc_count,
    }));
  }

  private mapPriceRangeBuckets(
    buckets?: PriceRangeBucket[],
  ): PriceRangeFacetBucket[] {
    return (buckets ?? []).map((bucket) => ({
      label: bucket.key,
      ...(bucket.from !== undefined ? { from: bucket.from } : {}),
      ...(bucket.to !== undefined ? { to: bucket.to } : {}),
      count: bucket.doc_count,
    }));
  }

  private toDocumentRecord(
    document: ProductSearchDocument,
  ): Record<string, unknown> {
    return document as unknown as Record<string, unknown>;
  }
}