import { Inject, Injectable, Logger } from '@nestjs/common';
import { Client, estypes } from '@elastic/elasticsearch';
import type {
  BulkOperationContainer,
  BulkUpdateAction,
} from '@elastic/elasticsearch/lib/api/types';
import { ELASTICSEARCH_CLIENT } from './elasticsearch.constants';
import { IndexMapping } from './interfaces/index-mapping.interface';
import {
  BulkDeleteOperation,
  BulkIndexOperation,
  BulkUpdateOperation,
  ElasticsearchSearchOptions,
  ElasticsearchSearchResult,
} from './interfaces/search-options.interface';

/**
 * ElasticsearchService
 *
 * A high-level service that wraps the @elastic/elasticsearch Client.
 * It provides strongly-typed helper methods for the most common operations:
 *  - Document CRUD (index, get, update, delete)
 *  - Bulk indexing, updating, and deleting
 *  - Full-text / kNN search with result normalisation
 *  - Index lifecycle management (create, delete, exists, put mapping)
 *  - Cluster health & ping
 *
 * Inject this service (not the raw client) in your feature services.
 *
 * @example
 * constructor(private readonly esService: ElasticsearchService) {}
 */
@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);

  constructor(
    @Inject(ELASTICSEARCH_CLIENT) private readonly client: Client,
  ) { }

  // ─── Cluster Operations ────────────────────────────────────────────────────

  /**
   * Sends a ping to the Elasticsearch cluster.
   * Returns true if the cluster is reachable, false otherwise.
   */
  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns basic cluster health information.
   * Status is 'green', 'yellow', or 'red'.
   */
  async clusterHealth(): Promise<estypes.ClusterHealthResponse> {
    return this.client.cluster.health();
  }

  // ─── Index Management ──────────────────────────────────────────────────────

  /**
   * Creates an Elasticsearch index with the supplied mapping and settings.
   * Does nothing (and logs a warn) if the index already exists.
   *
   * @param index  The index name to create.
   * @param body   Optional mapping and settings configuration.
   */
  async createIndex(index: string, body?: IndexMapping): Promise<void> {
    const exists = await this.indexExists(index);
    if (exists) {
      this.logger.warn(`Index "${index}" already exists — skipping creation.`);
      return;
    }

    await this.client.indices.create({
      index,
      ...(body?.mappings && { mappings: body.mappings as estypes.MappingTypeMapping }),
      ...(body?.settings && { settings: body.settings as estypes.IndicesIndexSettings }),
      ...(body?.aliases && { aliases: body.aliases as Record<string, estypes.IndicesAlias> }),
    });

    this.logger.log(`Index "${index}" created successfully.`);
  }

  /**
   * Deletes an Elasticsearch index.
   * Does nothing (and logs a warn) if the index does not exist.
   *
   * @param index  The index name to delete.
   */
  async deleteIndex(index: string): Promise<void> {
    const exists = await this.indexExists(index);
    if (!exists) {
      this.logger.warn(`Index "${index}" does not exist — skipping deletion.`);
      return;
    }

    await this.client.indices.delete({ index });
    this.logger.log(`Index "${index}" deleted.`);
  }

  /**
   * Checks whether an index with the given name exists.
   *
   * @param index  The index name to check.
   */
  async indexExists(index: string): Promise<boolean> {
    return this.client.indices.exists({ index });
  }

  /**
   * Adds or updates field mappings on an existing index.
   * Useful for adding new fields after initial index creation.
   *
   * @param index      The index to update.
   * @param properties Field mapping definitions to add or modify.
   */
  async putMapping(
    index: string,
    properties: Record<string, estypes.MappingProperty>,
  ): Promise<void> {
    await this.client.indices.putMapping({ index, properties });
    this.logger.log(`Mappings updated for index "${index}".`);
  }

  /**
   * Forces a refresh on one or more indices so that newly indexed documents
   * become immediately visible to search queries.
   *
   * ⚠️  Only use in tests or low-traffic scenarios — not in production hot paths.
   *
   * @param index  Index name(s) to refresh. Defaults to all indices ('_all').
   */
  async refresh(index: string | string[] = '_all'): Promise<void> {
    await this.client.indices.refresh({ index });
  }

  // ─── Document Operations ───────────────────────────────────────────────────

  /**
   * Indexes (creates or replaces) a single document.
   * If `id` is omitted, Elasticsearch auto-generates a UUID for the document.
   *
   * @param index     The target index.
   * @param document  The document body to index.
   * @param id        Optional document ID. If provided and already exists, the document is replaced.
   * @returns         The Elasticsearch-assigned document ID.
   */
  async indexDocument<T extends Record<string, unknown>>(
    index: string,
    document: T,
    id?: string,
  ): Promise<string> {
    const response = await this.client.index({
      index,
      id,
      document,
    });
    return response._id;
  }

  /**
   * Retrieves a single document by its ID.
   * Returns null if not found rather than throwing.
   *
   * @param index  The index to read from.
   * @param id     The document ID.
   */
  async getDocument<T extends Record<string, unknown>>(
    index: string,
    id: string,
  ): Promise<T | null> {
    try {
      const response = await this.client.get<T>({ index, id });
      return response._source ?? null;
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Applies a partial update to a document.
   * Only the supplied fields are modified; the rest are left untouched.
   *
   * @param index  The index containing the document.
   * @param id     The document ID to update.
   * @param doc    Partial document containing only the fields to change.
   */
  async updateDocument<T extends Record<string, unknown>>(
    index: string,
    id: string,
    doc: Partial<T>,
  ): Promise<void> {
    await this.client.update({ index, id, doc });
  }

  /**
   * Upserts a document — updates if it exists, creates it otherwise.
   *
   * @param index    The target index.
   * @param id       The document ID.
   * @param doc      Partial fields to update.
   * @param upsert   Full document to create if the ID does not yet exist.
   */
  async upsertDocument<T extends Record<string, unknown>>(
    index: string,
    id: string,
    doc: Partial<T>,
    upsert: T,
  ): Promise<void> {
    await this.client.update({ index, id, doc, upsert });
  }

  /**
   * Deletes a single document by its ID.
   *
   * @param index  The index containing the document.
   * @param id     The document ID to delete.
   */
  async deleteDocument(index: string, id: string): Promise<void> {
    await this.client.delete({ index, id });
  }

  /**
   * Deletes all documents that match a given query.
   * Useful for bulk logical deletions without dropping the entire index.
   *
   * @param index  The target index.
   * @param query  A valid Elasticsearch query DSL object.
   * @returns      The total number of documents deleted.
   */
  async deleteByQuery(
    index: string,
    query: estypes.QueryDslQueryContainer,
  ): Promise<number> {
    const response = await this.client.deleteByQuery({ index, query });
    return response.deleted ?? 0;
  }

  // ─── Bulk Operations ───────────────────────────────────────────────────────

  /**
   * Indexes multiple documents in a single batch request.
   * Significantly more efficient than calling indexDocument() in a loop.
   *
   * @param operations  Array of { index, id?, document } objects.
   */
  async bulkIndex<T extends Record<string, unknown>>(
    operations: BulkIndexOperation<T>[],
  ): Promise<void> {
    if (operations.length === 0) return;

    const body: Array<BulkOperationContainer | T> = operations.flatMap(
      ({ index, id, document }) => [
        { index: { _index: index, ...(id && { _id: id }) } },
        document,
      ],
    );

    const response = await this.client.bulk({ operations: body });

    if (response.errors) {
      const failed = response.items
        .filter((item) => item.index?.error)
        .map((item) => item.index?.error);
      this.logger.error(`Bulk index completed with errors:`, failed);
    }
  }

  /**
   * Updates multiple documents in a single batch request.
   *
   * @param operations  Array of { index, id, doc, upsert? } objects.
   */
  async bulkUpdate<T extends Record<string, unknown>>(
    operations: BulkUpdateOperation<T>[],
  ): Promise<void> {
    if (operations.length === 0) return;

    const body: Array<BulkOperationContainer | BulkUpdateAction<T, Partial<T>>> =
      operations.flatMap(({ index, id, doc, upsert }) => [
        { update: { _index: index, _id: id } },
        { doc, ...(upsert && { upsert }) },
      ]);

    const response = await this.client.bulk({ operations: body });

    if (response.errors) {
      const failed = response.items
        .filter((item) => item.update?.error)
        .map((item) => item.update?.error);
      this.logger.error(`Bulk update completed with errors:`, failed);
    }
  }

  /**
   * Deletes multiple documents in a single batch request.
   *
   * @param operations  Array of { index, id } objects.
   */
  async bulkDelete(operations: BulkDeleteOperation[]): Promise<void> {
    if (operations.length === 0) return;

    const body: BulkOperationContainer[] = operations.map(({ index, id }) => ({
      delete: { _index: index, _id: id },
    }));

    const response = await this.client.bulk({ operations: body });

    if (response.errors) {
      const failed = response.items
        .filter((item) => item.delete?.error)
        .map((item) => item.delete?.error);
      this.logger.error(`Bulk delete completed with errors:`, failed);
    }
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  /**
   * Executes a search query and returns a normalised result object.
   * Accepts the full Elasticsearch SearchRequest body so callers can use any
   * query type: match, multi_match, bool, kNN, aggregations, etc.
   *
   * @param options  Full Elasticsearch SearchRequest options (index + query body).
   * @returns        Normalised search result with typed hits, total count, and timing.
   *
   * @example
   * const result = await esService.search<Product>({
   *   index: 'products',
   *   query: { match: { title: 'keramik' } },
   *   size: 10,
   *   from: 0,
   * });
   */
  async search<T>(
    options: ElasticsearchSearchOptions,
  ): Promise<ElasticsearchSearchResult<T>> {
    const response = await this.client.search<T>(options);

    const total =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : (response.hits.total?.value ?? 0);

    return {
      total,
      took: response.took,
      timedOut: response.timed_out,
      hits: response.hits.hits.map((hit) => ({
        _index: hit._index,
        _id: hit._id!,
        _score: hit._score ?? null,
        _source: hit._source as T,
      })),
    };
  }

  /**
   * Executes a kNN (k-Nearest Neighbour) vector search.
   * Requires a 'dense_vector' field indexed with { index: true }.
   *
   * @param index         The index to search.
   * @param field         The dense_vector field name.
   * @param queryVector   The query vector (must match the field's dimensionality).
   * @param k             Number of nearest neighbours to return.
   * @param numCandidates Number of candidates to consider (must be >= k, recommended: k * 10).
   * @param filter        Optional filter query to narrow the kNN search scope.
   */
  async knnSearch<T>(
    index: string,
    field: string,
    queryVector: number[],
    k: number,
    numCandidates: number,
    filter?: estypes.QueryDslQueryContainer,
  ): Promise<ElasticsearchSearchResult<T>> {
    const response = await this.client.search<T>({
      index,
      knn: {
        field,
        query_vector: queryVector,
        k,
        num_candidates: numCandidates,
        ...(filter && { filter }),
      },
    });

    const total =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : (response.hits.total?.value ?? 0);

    return {
      total,
      took: response.took,
      timedOut: response.timed_out,
      hits: response.hits.hits.map((hit) => ({
        _index: hit._index,
        _id: hit._id!,
        _score: hit._score ?? null,
        _source: hit._source as T,
      })),
    };
  }

  /**
   * Performs a hybrid search combining a text query with kNN vector search.
   * Uses Reciprocal Rank Fusion (RRF) to merge and re-rank the two result sets.
   * Ideal for RAG (Retrieval-Augmented Generation) pipelines.
   *
   * @param index         The index to search.
   * @param textQuery     Standard query DSL clause (e.g. multi_match, bool).
   * @param knnField      Dense vector field name for kNN.
   * @param queryVector   Embedding vector for the kNN portion.
   * @param k             Number of nearest neighbours for kNN.
   * @param numCandidates Candidate count for kNN (recommended: k * 10).
   * @param size          Total number of results to return after RRF merging.
   */
  async hybridSearch<T>(
    index: string,
    textQuery: estypes.QueryDslQueryContainer,
    knnField: string,
    queryVector: number[],
    k: number,
    numCandidates: number,
    size = 10,
  ): Promise<ElasticsearchSearchResult<T>> {
    const response = await this.client.search<T>({
      index,
      query: textQuery,
      knn: {
        field: knnField,
        query_vector: queryVector,
        k,
        num_candidates: numCandidates,
      },
      rank: { rrf: {} },
      size,
    });

    const total =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : (response.hits.total?.value ?? 0);

    return {
      total,
      took: response.took,
      timedOut: response.timed_out,
      hits: response.hits.hits.map((hit) => ({
        _index: hit._index,
        _id: hit._id!,
        _score: hit._score ?? null,
        _source: hit._source as T,
      })),
    };
  }

  /**
   * Returns the underlying @elastic/elasticsearch Client instance.
   * Use this for advanced operations not covered by the service methods.
   *
   * @example
   * const info = await esService.getClient().info();
   */
  getClient(): Client {
    return this.client;
  }
}
