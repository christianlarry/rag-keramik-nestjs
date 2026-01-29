import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AccessTokenStrategy } from "./strategies/access-token.strategy";
import { AuthController } from "./auth.controller";
import { RefreshTokenStrategy } from "./strategies/refresh-token.strategy";
import { TokenModule } from "../../infrastructure/token/token.module";
import { MailModule } from "../mail/mail.module";
import { AuditModule } from "../audit/audit.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TokenModule,
    MailModule,
    AuditModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy
  ]
})
export class AuthModule { }