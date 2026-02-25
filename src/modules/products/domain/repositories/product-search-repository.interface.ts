import {
  ApplicationArea,
  FinishingType,
  Grade,
  ProductStatusType,
} from '../enums';

// ─────────────────────────────────────────────────────────────────────────────
// Injection Token
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCT_SEARCH_REPOSITORY_TOKEN = 'PRODUCT_SEARCH_REPOSITORY';

// ─────────────────────────────────────────────────────────────────────────────
// Document Shape  (flat structure stored in the ES index)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ProductSearchDocument
 *
 * Flat representation of a product as it is stored in the Elasticsearch index.
 * All domain value-objects are serialised to primitives so they can be indexed
 * and queried directly.
 *
 * This type is used both for indexing (write) and as the _source shape returned
 * in search hits (read).
 */
export interface ProductSearchDocument {
  // ── Core identity ──────────────────────────────────────────────────────────
  id: string;
  sku: string;

  // ── Search fields ──────────────────────────────────────────────────────────
  name: string;
  description: string | null;
  brand: string | null;

  // ── Price ──────────────────────────────────────────────────────────────────
  price: number;
  currency: string;

  // ── Tile attributes (flattened from ProductAttributes VO) ──────────────────
  /** Width in the index's canonical unit (cm). */
  sizeWidth: number;
  /** Height in the index's canonical unit (cm). */
  sizeHeight: number;
  /** Thickness in the index's canonical unit (cm). Null when not provided. */
  sizeThickness: number | null;
  /** Human-readable size label, e.g. "60x60", "30x60". */
  sizeLabel: string;

  grade: Grade | null;
  finishing: FinishingType | null;
  applicationAreas: ApplicationArea[];

  color: string | null;
  pattern: string | null;
  antiSlipRating: string | null;
  waterAbsorption: string | null;
  peiRating: number | null;
  isOutdoor: boolean;
  frostResistant: boolean;

  // ── Status ─────────────────────────────────────────────────────────────────
  status: ProductStatusType;

  // ── Packaging ──────────────────────────────────────────────────────────────
  tilePerBox: number;

  // ── Media ──────────────────────────────────────────────────────────────────
  imageUrl: string | null;

  // ── Timestamps ─────────────────────────────────────────────────────────────
  createdAt: string; // ISO-8601 string (ES 'date' type)
  updatedAt: string;

  // ── Vectors (optional — populated only when an embedding model is available) ─
  /**
   * Dense vector embedding of `name + description` for semantic / kNN search.
   * The dimensionality must match the `dense_vector.dims` configured in the
   * index mapping.  Omit this field if you are not running an embedding pipeline.
   */
  nameVector?: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Criteria  (input to the search method)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sort fields supported by the search repository.
 */
export type ProductSearchSortField =
  | 'price'
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | '_score';

export type SortOrder = 'asc' | 'desc';

/**
 * ProductSearchCriteria
 *
 * Encapsulates every parameter that can be passed to the repository's search
 * method.  All fields are optional — passing an empty object returns all
 * documents sorted by relevance.
 */
export interface ProductSearchCriteria {
  // ── Full-text search ───────────────────────────────────────────────────────
  /**
   * Free-text keyword query applied to `name`, `description`, `brand`,
   * `color`, and `pattern` fields via a multi_match query.
   */
  query?: string;

  // ── Exact / term-level filters ─────────────────────────────────────────────

  /** Filter by one or more specific SKUs. */
  skus?: string[];

  /** Filter by one or more brand names (case-insensitive keyword match). */
  brands?: string[];

  /** Filter by one or more product statuses. Default: ['ACTIVE']. */
  statuses?: ProductStatusType[];

  // ── Tile attribute filters ─────────────────────────────────────────────────

  /** Filter by one or more grades. */
  grades?: Grade[];

  /** Filter by one or more finishing types. */
  finishings?: FinishingType[];

  /**
   * Filter by one or more application areas.
   * A product matches if it supports AT LEAST ONE of the requested areas.
   */
  applicationAreas?: ApplicationArea[];

  /** Filter by one or more colour names. */
  colors?: string[];

  /** Filter by one or more pattern / motif names. */
  patterns?: string[];

  /** Filter by anti-slip rating (e.g. "R10", "R11"). */
  antiSlipRatings?: string[];

  /** Filter by PEI wear-resistance rating (1–5). */
  peiRatings?: number[];

  /** If true, only return products suitable for outdoor use. */
  isOutdoor?: boolean;

  /** If true, only return frost-resistant products. */
  frostResistant?: boolean;

  // ── Size filters ───────────────────────────────────────────────────────────

  /**
   * Filter by exact size labels (e.g. "60x60", "30x60").
   * Multiple values are combined with OR logic.
   */
  sizeLabels?: string[];

  /** Minimum tile width in cm (inclusive). */
  minWidth?: number;
  /** Maximum tile width in cm (inclusive). */
  maxWidth?: number;

  /** Minimum tile height in cm (inclusive). */
  minHeight?: number;
  /** Maximum tile height in cm (inclusive). */
  maxHeight?: number;

  // ── Price range filter ─────────────────────────────────────────────────────

  /** Minimum price (inclusive). */
  minPrice?: number;
  /** Maximum price (inclusive). */
  maxPrice?: number;

  // ── Semantic / vector search ───────────────────────────────────────────────

  /**
   * Optional embedding vector for the current query.
   * When provided, kNN search is performed against `nameVector`.
   * When both `query` and `queryVector` are set, hybrid search (BM25 + kNN)
   * is used with RRF re-ranking.
   */
  queryVector?: number[];

  /**
   * Number of nearest neighbours to retrieve in a kNN pass.
   * Default: equal to `limit`.
   */
  knnK?: number;

  /**
   * Candidate pool size for the HNSW kNN walk.  Higher = more accurate,
   * slower.  Default: knnK × 10.
   */
  knnNumCandidates?: number;

  // ── Facets ──────────────────────────────────────────────────────────────────

  /**
   * When true, the repository also computes and returns `facets`
   * (aggregations for brand, grade, finishing, applicationArea, and price
   * histogram).
   */
  includeFacets?: boolean;

  // ── Pagination ─────────────────────────────────────────────────────────────

  /** 1-based page number. Default: 1. */
  page?: number;

  /** Number of items per page. Default: 20. */
  limit?: number;

  // ── Sorting ────────────────────────────────────────────────────────────────

  /** Field to sort by. Default: '_score'. */
  sortBy?: ProductSearchSortField;

  /** Sort direction. Default: 'desc'. */
  sortOrder?: SortOrder;
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Result  (output from the search method)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single product hit returned from a search.
 */
export interface ProductSearchHit {
  /** The full document stored in Elasticsearch. */
  document: ProductSearchDocument;
  /**
   * BM25 / kNN relevance score assigned by Elasticsearch.
   * Higher = more relevant.  Null for pure filter queries.
   */
  score: number | null;
  /**
   * Highlighted text snippets for `name` and `description` fields.
   * Keys are field names, values contain the snippet with `<em>` tags
   * wrapping matched terms.
   */
  highlights?: Partial<Record<'name' | 'description', string[]>>;
}

/**
 * Facet bucket — a single item in an aggregation result set.
 */
export interface FacetBucket {
  /** The bucket value (keyword value or range label). */
  value: string;
  /** Number of documents matching this bucket. */
  count: number;
}

/**
 * Price range facet bucket with explicit from/to boundaries.
 */
export interface PriceRangeFacetBucket {
  label: string;
  from?: number;
  to?: number;
  count: number;
}

/**
 * Aggregation facets returned alongside search results when
 * `ProductSearchCriteria.includeFacets` is true.
 *
 * Each array represents the top-N buckets for that facet dimension.
 * Use these to render filter checkboxes / dropdowns in the UI.
 */
export interface ProductSearchFacets {
  brands: FacetBucket[];
  grades: FacetBucket[];
  finishings: FacetBucket[];
  applicationAreas: FacetBucket[];
  colors: FacetBucket[];
  sizeLabels: FacetBucket[];
  priceRanges: PriceRangeFacetBucket[];
}

/**
 * ProductSearchResult
 *
 * Envelope returned by every search operation.
 */
export interface ProductSearchResult {
  /** The matching document hits for the current page. */
  hits: ProductSearchHit[];

  /** Total number of documents matching the criteria (all pages). */
  total: number;

  /** Current page number (mirrors the requested page). */
  page: number;

  /** Number of items per page (mirrors the requested limit). */
  limit: number;

  /** Time taken by Elasticsearch to execute the query, in milliseconds. */
  took: number;

  /**
   * Faceted aggregation data.
   * Only populated when `ProductSearchCriteria.includeFacets` is true.
   */
  facets?: ProductSearchFacets;
}

// ─────────────────────────────────────────────────────────────────────────────
// Repository Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ProductSearchRepository
 *
 * Domain repository interface for all Elasticsearch interactions related to
 * products.  The concrete implementation lives in the infrastructure layer and
 * must be registered under `PRODUCT_SEARCH_REPOSITORY_TOKEN`.
 *
 * Responsibilities:
 *  - Maintain the Elasticsearch index (create / ensure mapping on startup).
 *  - Keep the index in sync with the write database (index / update / delete).
 *  - Expose expressive search methods consumed by application-layer use cases.
 *
 * This interface deliberately has NO dependency on the @elastic/elasticsearch
 * package — the domain layer stays framework-agnostic.
 */
export interface ProductSearchRepository {
  // ── Index lifecycle ────────────────────────────────────────────────────────

  /**
   * Creates the product index with the canonical mapping if it does not yet
   * exist.  Intended to be called from `OnModuleInit`.
   */
  ensureIndex(): Promise<void>;

  /**
   * Drops the product index entirely.
   * ⚠️  Destructive — use only in tests or during a planned full re-index.
   */
  dropIndex(): Promise<void>;

  // ── Single-document write operations ──────────────────────────────────────

  /**
   * Indexes (creates or fully replaces) a single product document.
   * The Postgres product ID is used as the Elasticsearch `_id`, ensuring
   * a 1-to-1 mapping between the two stores.
   *
   * @param document A flat `ProductSearchDocument` ready to be indexed.
   */
  index(document: ProductSearchDocument): Promise<void>;

  /**
   * Applies a partial update to an already-indexed product.
   * Only the supplied fields are overwritten; all other fields remain intact.
   * Throws if the document does not exist.
   *
   * @param id  The product UUID (= Elasticsearch `_id`).
   * @param doc Partial fields to update.
   */
  update(id: string, doc: Partial<ProductSearchDocument>): Promise<void>;

  /**
   * Removes a product document from the index.
   * Silent no-op if the document does not exist.
   *
   * @param id The product UUID to delete.
   */
  delete(id: string): Promise<void>;

  // ── Bulk write operations ──────────────────────────────────────────────────

  /**
   * Indexes a batch of product documents in a single Elasticsearch bulk
   * request.  Significantly more efficient than calling `index()` in a loop.
   *
   * Intended use-cases:
   *  - Initial full index population from the write database.
   *  - Periodic partial re-syncs for a subset of products.
   *
   * @param documents Array of `ProductSearchDocument` objects to index.
   */
  bulkIndex(documents: ProductSearchDocument[]): Promise<void>;

  /**
   * Removes all documents from the index that match the given product IDs.
   *
   * @param ids Array of product UUIDs to delete.
   */
  bulkDelete(ids: string[]): Promise<void>;

  // ── Read operations ────────────────────────────────────────────────────────

  /**
   * Performs a full paginated product search using any combination of
   * keyword, exact-match, range, vector (kNN), and hybrid criteria.
   *
   * This is the primary method consumed by application-layer use cases
   * (e.g. `SearchProductsUseCase`).
   *
   * @param criteria  All search parameters, filters, pagination, and sort options.
   * @returns         Paginated hits, total count, timing, and optional facets.
   */
  search(criteria: ProductSearchCriteria): Promise<ProductSearchResult>;

  /**
   * Retrieves the indexed document for a single product by its ID.
   * Returns null if the document is not in the index.
   *
   * Useful for verifying index state in tests or administrative tooling.
   *
   * @param id The product UUID.
   */
  findById(id: string): Promise<ProductSearchDocument | null>;

  /**
   * Returns autocomplete suggestions for the product name field based on
   * a partial prefix string.  Backed by a `prefix` or `match_bool_prefix`
   * query on the `name` field.
   *
   * @param prefix  The partial text typed by the user (e.g. "kera").
   * @param limit   Maximum number of suggestions to return. Default: 10.
   * @returns       Array of distinct product name strings.
   */
  suggest(prefix: string, limit?: number): Promise<string[]>;
}
