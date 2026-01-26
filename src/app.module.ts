import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Config Modules
import appConfig from 'src/config/app/app.config'
import prismaConfig from 'src/modules/prisma/config/prisma.config';

// Database Module
import { PrismaModule } from './modules/prisma/prisma.module';

// Feature Modules
import { UsersModule } from './modules/users/presentation/users.module';
import mailConfig from './modules/mail/config/mail.config';
import { MailerModule } from './modules/mailer/mailer.module';
import { MailModule } from './modules/mail/mail.module';
import { BullModule } from '@nestjs/bullmq';
import { AllConfigType } from './config/config.type';
import { AuthModule } from './modules/auth/auth.module';
import redisConfig from './modules/redis/config/redis.config';
import authConfig from './modules/auth/config/auth.config';
import { TokenModule } from './modules/token/token.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import rateLimitConfig from './config/rate-limit/rate-limit.config';
import { REDIS_CLIENT, RedisModule } from './modules/redis/redis.module';
import { Redis } from 'ioredis';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { CacheModule } from './modules/cache/cache.module';
import { AuditModule } from './modules/audit/audit.module';

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
        authConfig,
        rateLimitConfig
      ],
    }),
    RedisModule,
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
    TokenModule,
    PrismaModule,
    MailerModule,
    MailModule,
    UsersModule,
    AuthModule,
    AuditModule
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
