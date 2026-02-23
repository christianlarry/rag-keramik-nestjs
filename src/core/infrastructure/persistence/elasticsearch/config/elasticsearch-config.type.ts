/**
 * Configuration type for the Elasticsearch connection.
 * All values are populated from environment variables via elasticsearch.config.ts.
 */
export type ElasticsearchConfig = {
  /** The URL of the Elasticsearch node (e.g. http://localhost:9200). */
  node: string;

  /** Basic auth username. Optional when using API key auth. */
  username?: string;

  /** Basic auth password. Optional when using API key auth. */
  password?: string;

  /**
   * API key for authentication (base64-encoded).
   * When provided, takes precedence over username/password.
   */
  apiKey?: string;

  /** Request timeout in milliseconds. Default: 30000 (30s). */
  requestTimeout: number;

  /** Maximum number of retries on failure. Default: 3. */
  maxRetries: number;

  /** Enable gzip compression for request/response bodies. Default: false. */
  compression: boolean;

  /** TLS/SSL options for HTTPS connections. */
  tls: {
    /**
     * Whether to reject connections to servers with self-signed certificates.
     * Set to false only in development. Default: true.
     */
    rejectUnauthorized: boolean;
  };
};
