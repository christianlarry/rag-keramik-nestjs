import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Config Modules
import appConfig from 'src/config/app/app.config'
import prismaConfig from 'src/core/infrastructure/persistence/prisma/config/prisma.config';

// Database Module
import { PrismaModule } from 'src/core/infrastructure/persistence/prisma/prisma.module';

// Feature Modules
import { UsersModule } from './modules/users/users.module';
import mailConfig from './core/infrastructure/services/mail/config/mail.config';
import { MailModule } from './core/infrastructure/services/mail/mail.module';
import { BullModule } from '@nestjs/bullmq';
import { AllConfigType } from './config/config.type';
import { AuthModule } from './modules/auth/auth.module';
import redisConfig from './core/infrastructure/persistence/redis/config/redis.config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import rateLimitConfig from './config/rate-limit/rate-limit.config';
import { REDIS_CLIENT, RedisModule } from './core/infrastructure/persistence/redis/redis.module';
import { Redis } from 'ioredis';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { AuditModule } from './core/infrastructure/services/audit/audit.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TokenGeneratorModule } from './core/infrastructure/services/token-generator/token-generator.module';
import { JwtModule } from '@nestjs/jwt';
import authConfig from './modules/auth/infrastructure/config/auth.config';
import authGoogleConfig from './modules/auth/infrastructure/config/auth-google.config';
import authFacebookConfig from './modules/auth/infrastructure/config/auth-facebook.config';
import { MailerModule } from './core/infrastructure/mailer/mailer.module';
import { CacheModule } from './core/infrastructure/services/cache/cache.module';
import { CacheInvalidatorModule } from './core/infrastructure/services/cache-invalidator/cache-invalidator.module';
import elasticsearchConfig from './core/infrastructure/persistence/elasticsearch/config/elasticsearch.config';
import { ElasticsearchModule } from './core/infrastructure/persistence/elasticsearch/elasticsearch.module';

@Module({
  imports: [
    // Configuration Modules, make it global so other modules can access it without importing again
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      // Load config files, can add more config files here
      load: [
        appConfig,
        prismaConfig,
        mailConfig,
        redisConfig,
        elasticsearchConfig,
        authConfig,
        authGoogleConfig,
        authFacebookConfig,
        rateLimitConfig
      ],
    }),
    RedisModule,
    ElasticsearchModule,
    CacheModule,
    // Redis configuration for BullMQ
    BullModule.forRootAsync({
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => ({
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
          },
        },
        prefix: 'bull', // Optional: set a prefix for all queues
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService, REDIS_CLIENT],
      useFactory: (
        configService: ConfigService<AllConfigType>,
        redis: Redis
      ) => ({
        throttlers: [{
          ttl: configService.get('rateLimit.ttl', { infer: true }) || 60000,
          limit: configService.get('rateLimit.limit', { infer: true }) || 10,
        }],
        storage: new ThrottlerStorageRedisService(redis),
        skipIf: () => {
          return configService.get('app.nodeEnv', { infer: true })! === 'development';
        },
      }),
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    JwtModule.register({
      global: true,
    }),
    PrismaModule,
    MailerModule,
    MailModule,
    UsersModule,
    AuthModule,
    AuditModule,
    TokenGeneratorModule,
    CacheInvalidatorModule
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService,
    // Global Throttler Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule { }
