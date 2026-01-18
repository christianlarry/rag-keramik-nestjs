import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AccessTokenStrategy } from "./strategies/access-token.strategy";
import { AuthController } from "./auth.controller";
import { RefreshTokenStrategy } from "./strategies/refresh-token.strategy";
import { TokenModule } from "../token/token.module";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TokenModule,
    MailModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy
  ]
})
export class AuthModule { }