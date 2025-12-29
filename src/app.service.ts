import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from './config/config.type';

@Injectable()
export class AppService {

  constructor(private readonly configService: ConfigService<AllConfigType>) { }
  appInfo() {

    const APP_NAME = this.configService.getOrThrow('app.name', { infer: true });
    const NODE_ENV = this.configService.getOrThrow('app.nodeEnv', { infer: true });

    return {
      name: APP_NAME,
      environment: NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,
      message: `See full OpenAPI documentation at ${this.configService.getOrThrow('app.docsUrl', { infer: true })} for API usage information.`,
    };
  }

  checkHealth(): string {
    return 'OK';
  }
}
