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
import { UsersModule } from './modules/users/users.module';
import mailConfig from './modules/mail/config/mail.config';
import { MailerModule } from './modules/mailer/mailer.module';
import { MailModule } from './modules/mail/mail.module';
import { BullModule } from '@nestjs/bullmq';
import { AllConfigType } from './config/config.type';
import { AuthModule } from './modules/auth/auth.module';
import redisConfig from './modules/redis/config/redis.config';
import authConfig from './modules/auth/config/auth.config';
import { TokenModule } from './modules/token/token.module';

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
        authConfig
      ],
    }),
    // Redis configuration for BullMQ
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        connection: {
          host: configService.get('redis.host', { infer: true }) || 'localhost',
          port: configService.get('redis.port', { infer: true }) || 6379,
          password: configService.get('redis.password', { infer: true }),
          db: configService.get('redis.db', { infer: true }) || 0,
        },
        defaultJobOptions: {
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
          },
        },
      }),
      inject: [ConfigService],
    }),
    TokenModule,
    PrismaModule,
    MailerModule,
    MailModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService
  ],
})
export class AppModule { }
