import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';

/**
 * Health status returned by ElasticsearchHealthIndicator.
 */
export interface ElasticsearchHealthStatus {
  status: 'up' | 'down';
  /** Cluster health colour reported by Elasticsearch ('green', 'yellow', 'red'). */
  clusterStatus?: 'green' | 'yellow' | 'red';
  /** Number of active data nodes in the cluster. */
  numberOfNodes?: number;
  /** Latency of the ping in milliseconds. */
  responseTimeMs?: number;
  /** Human-readable error message when status is 'down'. */
  error?: string;
}

/**
 * ElasticsearchHealthIndicator
 *
 * A standalone health-check provider for Elasticsearch.
 * It does NOT require @nestjs/terminus and can be used:
 *
 *  1. Directly — inject the service and call check() from any controller.
 *  2. With @nestjs/terminus — wrap the result in a HealthIndicatorResult.
 *
 * @example
 * // Standalone usage in a health controller
 * @Get('/health')
 * async health() {
 *   return this.esHealthIndicator.check();
 * }
 *
 * @example
 * // With @nestjs/terminus HealthCheckService
 * @Get('/health')
 * @HealthCheck()
 * health() {
 *   return this.healthCheckService.check([
 *     () => this.esHealthIndicator.toTerminusIndicator('elasticsearch'),
 *   ]);
 * }
 */
@Injectable()
export class ElasticsearchHealthIndicator {
  private readonly logger = new Logger(ElasticsearchHealthIndicator.name);

  constructor(private readonly esService: ElasticsearchService) { }

  /**
   * Performs a health check against the Elasticsearch cluster.
   * Returns a detailed status object with cluster colour, node count, and response time.
   */
  async check(): Promise<ElasticsearchHealthStatus> {
    const start = Date.now();

    try {
      const isAlive = await this.esService.ping();

      if (!isAlive) {
        return {
          status: 'down',
          error: 'Ping returned false — cluster may be starting up or unreachable.',
        };
      }

      const health = await this.esService.clusterHealth();
      const responseTimeMs = Date.now() - start;

      return {
        status: 'up',
        clusterStatus: health.status as 'green' | 'yellow' | 'red',
        numberOfNodes: health.number_of_nodes,
        responseTimeMs,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Elasticsearch health check failed: ${message}`);

      return {
        status: 'down',
        error: message,
      };
    }
  }

  /**
   * Returns a @nestjs/terminus-compatible HealthIndicatorResult object.
   * Install @nestjs/terminus and call this inside a HealthCheckService.check() array.
   *
   * @param key     The key name used in the health response JSON (e.g. 'elasticsearch').
   *
   * @example
   * return this.healthCheckService.check([
   *   () => this.esHealthIndicator.toTerminusIndicator('elasticsearch'),
   * ]);
   */
  async toTerminusIndicator(
    key: string,
  ): Promise<Record<string, { status: 'up' | 'down';[key: string]: unknown }>> {
    const result = await this.check();

    return {
      [key]: {
        status: result.status,
        ...(result.clusterStatus && { clusterStatus: result.clusterStatus }),
        ...(result.numberOfNodes !== undefined && { nodes: result.numberOfNodes }),
        ...(result.responseTimeMs !== undefined && { responseTimeMs: result.responseTimeMs }),
        ...(result.error && { error: result.error }),
      },
    };
  }
}
