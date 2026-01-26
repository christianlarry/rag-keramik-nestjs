import { Module } from "@nestjs/common";
import { UsersModule } from "../users/presentation/users.module";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AccessTokenStrategy } from "./strategies/access-token.strategy";
import { AuthController } from "./auth.controller";
import { RefreshTokenStrategy } from "./strategies/refresh-token.strategy";
import { TokenModule } from "../token/token.module";
import { MailModule } from "../mail/mail.module";
import { AuditModule } from "../audit/audit.module";

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