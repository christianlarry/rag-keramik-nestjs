/**
 * Injection token for the Elasticsearch Client instance.
 * Used to inject the raw @elastic/elasticsearch Client wherever direct access is needed.
 *
 * @example
 * // Inject via constructor
 * constructor(@Inject(ELASTICSEARCH_CLIENT) private readonly client: Client) {}
 */
export const ELASTICSEARCH_CLIENT = 'ELASTICSEARCH_CLIENT';
