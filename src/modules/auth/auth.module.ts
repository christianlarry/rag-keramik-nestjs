import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AccessTokenStrategy } from "./infrastructure/strategies/access-token.strategy";
import { AuthController } from "./auth.controller";
import { RefreshTokenStrategy } from "./infrastructure/strategies/refresh-token.strategy";
import { TokenModule } from "../token/token.module";
import { MailModule } from "../mail/mail.module";
import { AuditModule } from "../audit/audit.module";
import { AUTH_USER_REPOSITORY_TOKEN } from "./domain/repositories/auth-user-repository.interface";
import { PrismaAuthUserRepository } from "./infrastructure/repositories/prisma-auth-user.repository";
import { RegisterUseCase } from "./application/use-cases/register.usecase";
import { PASSWORD_HASHER_TOKEN } from "./domain/services/password-hasher.interface";
import { BcryptPasswordHasher } from "./infrastructure/hasher/bcrypt-password.hasher";
import { UNIT_OF_WORK_TOKEN } from "src/core/application/unit-of-work.interface";
import { PrismaUnitOfWork } from "../prisma/prisma-unit-of-work";
import { ResendEmailVerificationUseCase } from "./application/use-cases/resend-email-verification.usecase";
import { VerifyEmailUseCase } from "./application/use-cases/verify-email.usecase";

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
    {
      provide: PASSWORD_HASHER_TOKEN,
      useClass: BcryptPasswordHasher
    },
    {
      provide: UNIT_OF_WORK_TOKEN,
      useClass: PrismaUnitOfWork
    },

    // Use Cases can be added here
    RegisterUseCase,
    ResendEmailVerificationUseCase,
    VerifyEmailUseCase
  ]
})
export class AuthModule { }