import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

// Config Modules
import appConfig from 'src/config/app.config'
import prismaConfig from 'src/modules/prisma/config/prisma.config';

// Database Module
import { PrismaModule } from './modules/prisma/prisma.module';

// Feature Modules
import { UsersModule } from './modules/users/users.module';
import mailConfig from './modules/mail/config/mail.config';
import { MailerModule } from './modules/mailer/mailer.module';
import { MailModule } from './modules/mail/mail.module';

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
        mailConfig
      ],
    }),
    PrismaModule,
    MailerModule,
    MailModule,
    UsersModule,
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService
  ],
})
export class AppModule { }
