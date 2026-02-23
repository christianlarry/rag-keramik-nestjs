import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import validateConfig from 'src/utils/validate-config';
import { ElasticsearchConfig } from './elasticsearch-config.type';

class EnvironmentVariablesValidator {
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  ELASTICSEARCH_NODE: string;

  @IsString()
  @IsOptional()
  ELASTICSEARCH_USERNAME: string;

  @IsString()
  @IsOptional()
  ELASTICSEARCH_PASSWORD: string;

  @IsString()
  @IsOptional()
  ELASTICSEARCH_API_KEY: string;

  @IsInt()
  @Min(1000)
  @Max(300000)
  @IsOptional()
  ELASTICSEARCH_REQUEST_TIMEOUT: number;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  ELASTICSEARCH_MAX_RETRIES: number;

  @IsBoolean()
  @IsOptional()
  ELASTICSEARCH_COMPRESSION: boolean;

  @IsBoolean()
  @IsOptional()
  ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED: boolean;
}

/**
 * Registers the Elasticsearch configuration under the 'elasticsearch' namespace.
 * Validates all relevant environment variables on startup.
 *
 * Required environment variable:
 *   ELASTICSEARCH_NODE — The full URL to the Elasticsearch node.
 *
 * Optional environment variables:
 *   ELASTICSEARCH_USERNAME             — Basic auth username
 *   ELASTICSEARCH_PASSWORD             — Basic auth password
 *   ELASTICSEARCH_API_KEY              — API key (base64-encoded)
 *   ELASTICSEARCH_REQUEST_TIMEOUT      — Request timeout in ms (default: 30000)
 *   ELASTICSEARCH_MAX_RETRIES          — Max retries on error (default: 3)
 *   ELASTICSEARCH_COMPRESSION          — Enable compression, true/false (default: false)
 *   ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED — Reject self-signed TLS (default: true)
 */
export default registerAs<ElasticsearchConfig>('elasticsearch', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
    apiKey: process.env.ELASTICSEARCH_API_KEY,
    requestTimeout: process.env.ELASTICSEARCH_REQUEST_TIMEOUT
      ? parseInt(process.env.ELASTICSEARCH_REQUEST_TIMEOUT, 10)
      : 30000,
    maxRetries: process.env.ELASTICSEARCH_MAX_RETRIES
      ? parseInt(process.env.ELASTICSEARCH_MAX_RETRIES, 10)
      : 3,
    compression: process.env.ELASTICSEARCH_COMPRESSION === 'true',
    tls: {
      rejectUnauthorized:
        process.env.ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  };
});
