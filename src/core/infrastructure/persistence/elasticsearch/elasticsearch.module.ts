import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, HttpConnection } from '@elastic/elasticsearch';
import { AllConfigType } from 'src/config/config.type';
import { ELASTICSEARCH_CLIENT } from './elasticsearch.constants';
import { ElasticsearchService } from './elasticsearch.service';
import { ElasticsearchHealthIndicator } from './elasticsearch.health';

/**
 * ElasticsearchModule
 *
 * A global NestJS module that bootstraps the @elastic/elasticsearch Client
 * using validated environment variables via ConfigService.
 *
 * Provides and exports:
 *  - ELASTICSEARCH_CLIENT  — the raw @elastic/elasticsearch Client (for advanced use)
 *  - ElasticsearchService  — high-level typed wrapper (recommended for feature services)
 *  - ElasticsearchHealthIndicator — Terminus-compatible health check
 *
 * Decorated with @Global() so you only need to import it once (in AppModule).
 *
 * Connection lifecycle:
 *  - onModuleInit:    performs a ping to verify connectivity
 *  - onModuleDestroy: gracefully closes the connection pool
 *
 * @example
 * // AppModule
 * imports: [ElasticsearchModule, ...]
 *
 * // Any feature service
 * constructor(private readonly esService: ElasticsearchService) {}
 */
@Global()
@Module({
  providers: [
    // ── Raw Client Provider ────────────────────────────────────────────────
    {
      provide: ELASTICSEARCH_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const logger = new Logger('ElasticsearchModule');

        const node = configService.get('elasticsearch.node', { infer: true });
        const username = configService.get('elasticsearch.username', { infer: true });
        const password = configService.get('elasticsearch.password', { infer: true });
        const apiKey = configService.get('elasticsearch.apiKey', { infer: true });
        const requestTimeout = configService.get('elasticsearch.requestTimeout', { infer: true });
        const maxRetries = configService.get('elasticsearch.maxRetries', { infer: true });
        const compression = configService.get('elasticsearch.compression', { infer: true });
        const rejectUnauthorized = configService.get(
          'elasticsearch.tls.rejectUnauthorized',
          { infer: true },
        );

        // ── Authentication ─────────────────────────────────────────────────
        // API key takes precedence over basic auth.
        const auth = apiKey
          ? { apiKey }
          : username && password
            ? { username, password }
            : undefined;

        const client = new Client({
          node: node ?? 'http://localhost:9200',
          ...(auth && { auth }),
          requestTimeout: requestTimeout ?? 30_000,
          maxRetries: maxRetries ?? 3,
          compression: compression,
          // Use HttpConnection for standard HTTP/HTTPS (not NDJSON streaming)
          Connection: HttpConnection,
          tls: {
            rejectUnauthorized: rejectUnauthorized ?? true,
          },
        });

        logger.log(
          `Elasticsearch client configured → node: ${node ?? 'http://localhost:9200'}`,
        );

        return client;
      },
    },

    // ── Service & Health ───────────────────────────────────────────────────
    ElasticsearchService,
    ElasticsearchHealthIndicator,
  ],
  exports: [
    ELASTICSEARCH_CLIENT,
    ElasticsearchService,
    ElasticsearchHealthIndicator,
  ],
})
export class ElasticsearchModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ElasticsearchModule.name);

  constructor(
    @Inject(ELASTICSEARCH_CLIENT) private readonly client: Client,
  ) { }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.ping();
      this.logger.log('Elasticsearch cluster is reachable.');
    } catch (error: unknown) {
      // Log the error but do NOT crash the application.
      // Services that depend on ES will fail gracefully when they actually try to use it.
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to reach Elasticsearch cluster: ${message}. ` +
        'The application will continue, but Elasticsearch operations may fail.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.close();
      this.logger.log('Elasticsearch connection closed.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error closing Elasticsearch connection: ${message}`);
    }
  }
}
