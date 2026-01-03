import { Processor } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AllConfigType } from "src/config/config.type";
import { MailService } from "../mail.service";

@Processor("mail-queue")
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService<AllConfigType>
  ) { }


}