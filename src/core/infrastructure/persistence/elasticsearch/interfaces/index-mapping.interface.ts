/**
 * Defines the shape of an Elasticsearch index creation request body.
 * Used by ElasticsearchService.createIndex() to type the mapping/settings payload.
 */
export interface IndexMapping {
  /**
   * Mappings define how documents and their fields are stored and indexed.
   * This controls how Elasticsearch interprets data types for each field.
   */
  mappings?: {
    /**
     * Controls whether new fields not in the mapping are added automatically.
     * - true (default): new fields are added
     * - false: new fields are silently ignored and NOT indexed
     * - 'strict': new fields cause a mapping exception (fail loudly)
     * - 'runtime': new fields are added as runtime fields
     */
    dynamic?: boolean | 'strict' | 'runtime';

    /** Field-to-property mapping definitions. */
    properties?: Record<string, PropertyMapping>;
  };

  /**
   * Index-level settings such as number of shards, replicas, and custom analyzers.
   */
  settings?: {
    number_of_shards?: number;
    number_of_replicas?: number;
    refresh_interval?: string;
    analysis?: {
      analyzer?: Record<string, AnalyzerDefinition>;
      filter?: Record<string, TokenFilterDefinition>;
      tokenizer?: Record<string, TokenizerDefinition>;
      char_filter?: Record<string, CharFilterDefinition>;
    };
    [key: string]: unknown;
  };

  /** Named aliases to create along with the index. */
  aliases?: Record<string, { filter?: Record<string, unknown>; routing?: string }>;
}

// ─── Property Mapping Types ───────────────────────────────────────────────────

/** A union type representing all supported Elasticsearch field types. */
export type PropertyMapping =
  | TextPropertyMapping
  | KeywordPropertyMapping
  | NumericPropertyMapping
  | DatePropertyMapping
  | BooleanPropertyMapping
  | ObjectPropertyMapping
  | NestedPropertyMapping
  | DenseVectorPropertyMapping
  | GeoPointPropertyMapping
  | IpPropertyMapping
  | FlattenedPropertyMapping
  | WildcardPropertyMapping;

/** Full-text search field. Analyzed and tokenized. */
export interface TextPropertyMapping {
  type: 'text';
  analyzer?: string;
  search_analyzer?: string;
  similarity?: string;
  /** Sub-fields for multi-field indexing (e.g., raw keyword sub-field for sorting). */
  fields?: Record<string, { type: 'keyword' | 'text';[key: string]: unknown }>;
  fielddata?: boolean;
  boost?: number;
  index?: boolean;
  store?: boolean;
  [key: string]: unknown;
}

/** Exact-match keyword field. Not analyzed. Ideal for filtering, aggregation, sorting. */
export interface KeywordPropertyMapping {
  type: 'keyword';
  ignore_above?: number;
  normalizer?: string;
  doc_values?: boolean;
  index?: boolean;
  eager_global_ordinals?: boolean;
  [key: string]: unknown;
}

/** Numeric fields: integer, long, float, double, short, byte, half_float, scaled_float. */
export interface NumericPropertyMapping {
  type:
  | 'integer'
  | 'long'
  | 'short'
  | 'byte'
  | 'float'
  | 'double'
  | 'half_float'
  | 'scaled_float'
  | 'unsigned_long';
  scaling_factor?: number; // Required for scaled_float
  index?: boolean;
  doc_values?: boolean;
  null_value?: number;
  [key: string]: unknown;
}

/** Date / datetime field. */
export interface DatePropertyMapping {
  type: 'date' | 'date_nanos';
  format?: string; // e.g. "yyyy-MM-dd HH:mm:ss||epoch_millis"
  index?: boolean;
  doc_values?: boolean;
  null_value?: string;
  [key: string]: unknown;
}

/** Boolean field. */
export interface BooleanPropertyMapping {
  type: 'boolean';
  null_value?: boolean;
  index?: boolean;
  doc_values?: boolean;
  [key: string]: unknown;
}

/**
 * Object field — a JSON object flattened into the parent document.
 * Each sub-field is a first-class field in Lucene.
 * NOTE: array of objects lose their correlation — use 'nested' for that.
 */
export interface ObjectPropertyMapping {
  type?: 'object'; // 'type' is optional; absence defaults to object
  dynamic?: boolean | 'strict';
  properties?: Record<string, PropertyMapping>;
  enabled?: boolean;
  [key: string]: unknown;
}

/**
 * Nested field — array of objects where each object is indexed as a separate
 * hidden document, preserving field correlations within each object.
 */
export interface NestedPropertyMapping {
  type: 'nested';
  properties?: Record<string, PropertyMapping>;
  dynamic?: boolean | 'strict';
  include_in_parent?: boolean;
  include_in_root?: boolean;
  [key: string]: unknown;
}

/**
 * Dense vector field for k-nearest neighbour (kNN) search and vector similarity.
 * Used for semantic search / RAG pipelines.
 */
export interface DenseVectorPropertyMapping {
  type: 'dense_vector';
  /** Dimensionality of the vector (number of float elements). */
  dims: number;
  index?: boolean;
  similarity?: 'l2_norm' | 'dot_product' | 'cosine' | 'max_inner_product';
  index_options?: {
    type: 'hnsw' | 'flat' | 'int8_hnsw' | 'int4_hnsw' | 'bbq_hnsw';
    m?: number;
    ef_construction?: number;
  };
  [key: string]: unknown;
}

/** Geo-point field for lat/lon coordinate storage and geo queries. */
export interface GeoPointPropertyMapping {
  type: 'geo_point';
  ignore_malformed?: boolean;
  ignore_z_value?: boolean;
  null_value?: { lat: number; lon: number };
  [key: string]: unknown;
}

/** IP address field (IPv4 / IPv6). */
export interface IpPropertyMapping {
  type: 'ip';
  index?: boolean;
  doc_values?: boolean;
  null_value?: string;
  [key: string]: unknown;
}

/**
 * Flattened — maps an entire JSON object as a single field.
 * Useful when keys are dynamic and unknown ahead of time.
 */
export interface FlattenedPropertyMapping {
  type: 'flattened';
  depth_limit?: number;
  [key: string]: unknown;
}

/** Wildcard field — optimised for wildcard and regex queries on arbitrary strings. */
export interface WildcardPropertyMapping {
  type: 'wildcard';
  null_value?: string;
  ignore_above?: number;
  [key: string]: unknown;
}

// ─── Analyzer / Filter / Tokenizer Types ─────────────────────────────────────

export interface AnalyzerDefinition {
  type: 'custom' | 'standard' | 'simple' | 'whitespace' | 'stop' | 'keyword' | 'pattern' | 'language' | string;
  tokenizer?: string;
  filter?: string[];
  char_filter?: string[];
  stopwords?: string | string[];
  [key: string]: unknown;
}

export interface TokenFilterDefinition {
  type: string;
  [key: string]: unknown;
}

export interface TokenizerDefinition {
  type: string;
  [key: string]: unknown;
}

export interface CharFilterDefinition {
  type: string;
  [key: string]: unknown;
}
