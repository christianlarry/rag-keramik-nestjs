import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MailerModule } from '../../infrastructure/mailer/mailer.module';
import { MAIL_QUEUE_NAME } from './constants/mail-queue.constants';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule,
    BullModule.registerQueue({
      name: MAIL_QUEUE_NAME,
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule { }