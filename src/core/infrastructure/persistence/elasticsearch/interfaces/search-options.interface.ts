import type { SearchRequest } from '@elastic/elasticsearch/lib/api/types';

/**
 * Re-exports Elasticsearch's native SearchRequest type so callers can
 * strongly type their search payloads without importing from the client directly.
 *
 * @example
 * const options: ElasticsearchSearchOptions = {
 *   index: 'products',
 *   query: {
 *     multi_match: { query: 'keramik', fields: ['title', 'description'] },
 *   },
 *   size: 10,
 *   from: 0,
 * };
 */
export type ElasticsearchSearchOptions = SearchRequest;

// ─── Bulk Operation Builders ──────────────────────────────────────────────────

/**
 * Represents a single document to be indexed in a bulk operation.
 * T is the shape of the source document.
 */
export interface BulkIndexOperation<T extends Record<string, unknown>> {
  /** The Elasticsearch index name. */
  index: string;
  /** Optional document ID. If omitted, Elasticsearch auto-generates one. */
  id?: string;
  /** The document body to index. */
  document: T;
}

/**
 * Represents a single document update in a bulk operation.
 */
export interface BulkUpdateOperation<T extends Record<string, unknown>> {
  index: string;
  id: string;
  /** Partial document containing only the fields to update. */
  doc: Partial<T>;
  /** If true, creates the document if it does not already exist. */
  upsert?: T;
}

/**
 * Represents a single document deletion in a bulk operation.
 */
export interface BulkDeleteOperation {
  index: string;
  id: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Standard pagination options supported by Elasticsearch. */
export interface PaginationOptions {
  /** Number of documents to skip (offset). Default: 0. */
  from?: number;
  /** Maximum number of documents to return. Default: 10. */
  size?: number;
}

// ─── Search Result Wrappers ───────────────────────────────────────────────────

/**
 * A typed wrapper around a single Elasticsearch hit.
 * T is the shape of your source document.
 */
export interface ElasticsearchHit<T> {
  _index: string;
  _id: string;
  _score: number | null;
  _source: T;
}

/**
 * A typed wrapper around the Elasticsearch search result set.
 */
export interface ElasticsearchSearchResult<T> {
  /** Total hit count (exact or lower-bound). */
  total: number;
  /** The actual document hits. */
  hits: ElasticsearchHit<T>[];
  /** Time taken by the ES cluster to execute the query, in milliseconds. */
  took: number;
  /** True if the search timed out before completing. */
  timedOut: boolean;
}
