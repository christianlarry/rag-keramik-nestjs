import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AccessTokenStrategy } from "./strategies/access-token.strategy";
import { AuthController } from "./auth.controller";
import { RefreshTokenStrategy } from "./strategies/refresh-token.strategy";
import { TokenModule } from "../token/token.module";
import { MailModule } from "../mail/mail.module";
import { AuditModule } from "../audit/audit.module";
import { AUTH_USER_REPOSITORY_TOKEN } from "./domain/repositories/auth-user-repository.interface";
import { PrismaAuthUserRepository } from "./infrastructure/repositories/prisma-auth-user.repository";
import { RegisterUseCase } from "./application/use-cases/register.usecase";

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
    // Infrastructure Services
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    {
      provide: AUTH_USER_REPOSITORY_TOKEN,
      useClass: PrismaAuthUserRepository
    },

    // Use Cases can be added here
    RegisterUseCase
  ]
})
export class AuthModule { }