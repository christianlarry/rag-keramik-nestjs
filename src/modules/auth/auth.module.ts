import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { PassportModule } from "@nestjs/passport";
import { AccessTokenStrategy } from "./infrastructure/strategies/access-token.strategy";
import { RefreshTokenStrategy } from "./infrastructure/strategies/refresh-token.strategy";
import { TokenModule } from "../token/token.module";
import { MailModule } from "../mail/mail.module";
import { AuditModule } from "../audit/audit.module";
import { AUTH_USER_REPOSITORY_TOKEN } from "./domain/repositories/auth-user-repository.interface";
import { PrismaAuthUserRepository } from "./infrastructure/repositories/prisma-auth-user.repository";
import { RegisterUseCase } from "./application/use-cases/register.usecase";
import { PASSWORD_HASHER_TOKEN } from "./domain/services/password-hasher.interface";
import { UNIT_OF_WORK_TOKEN } from "src/core/application/unit-of-work.interface";
import { PrismaUnitOfWork } from "../prisma/prisma-unit-of-work";
import { ResendEmailVerificationUseCase } from "./application/use-cases/resend-email-verification.usecase";
import { VerifyEmailUseCase } from "./application/use-cases/verify-email.usecase";
import { ResetPasswordUseCase } from "./application/use-cases/reset-password.usecase";
import { PasswordResetTokenRepository } from "./infrastructure/repositories/password-reset-token.repository";
import { ForgotPasswordUseCase } from "./application/use-cases/forgot-password.usecase";
import { VerificationTokenRepository } from "./infrastructure/repositories/email-verification-token.repository";
import { TokenGeneratorModule } from "src/core/infrastructure/services/token-generator/token-generator.module";
import { AccessTokenGenerator } from "./infrastructure/generator/access-token.generator";
import { RefreshTokenGenerator } from "./infrastructure/generator/refresh-token.generator";
import { LoginWithEmailUseCase } from "./application/use-cases/login-with-email.usecase";
import { BlacklistedAccessTokenRepository } from "./infrastructure/repositories/blacklisted-access-token.repository";
import { Argon2PasswordHasher } from "./infrastructure/hasher/argon2-password.hasher";
import { ValidateAccessTokenUseCase } from "./application/use-cases/validate-access-token.usecase";
import { ValidateRefreshTokenUseCase } from "./application/use-cases/validate-refresh-token.usecase";
import { LogoutUseCase } from "./application/use-cases/logout.usecase";
import { RefreshTokenUseCase } from "./application/use-cases/refresh-token.usecase";
import { ChangePasswordUseCase } from "./application/use-cases/change-password.usecase";
import { AuthController } from "./presentation/http/auth.controller";
import { GoogleAuthCallbackUseCase } from "./application/use-cases/google-auth-callback.usecase";
import { AuthGoogleController } from "./presentation/http/auth-google.controller";
import { GoogleStrategy } from "./infrastructure/strategies/google.strategy";
import { FacebookStrategy } from "./infrastructure/strategies/facebook.strategy";
import { AUTH_USER_QUERY_REPOSITORY_TOKEN } from "./domain/repositories/auth-user-query-repository.inteface";
import { PrismaAuthUserQueryRepository } from "./infrastructure/repositories/prisma-auth-user-query.repository";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TokenModule,
    MailModule,
    AuditModule,
    TokenGeneratorModule
  ],
  controllers: [
    AuthController,
    AuthGoogleController
  ],
  providers: [
    // Infrastructure Services
    {
      provide: AUTH_USER_REPOSITORY_TOKEN,
      useClass: PrismaAuthUserRepository
    },
    {
      provide: AUTH_USER_QUERY_REPOSITORY_TOKEN,
      useClass: PrismaAuthUserQueryRepository
    },
    {
      provide: PASSWORD_HASHER_TOKEN,
      useClass: Argon2PasswordHasher
    },
    {
      provide: UNIT_OF_WORK_TOKEN,
      useClass: PrismaUnitOfWork
    },
    PasswordResetTokenRepository,
    VerificationTokenRepository,
    BlacklistedAccessTokenRepository,

    // Passport Strategies
    AccessTokenStrategy,
    RefreshTokenStrategy,
    GoogleStrategy,
    FacebookStrategy,

    // Token Generators
    AccessTokenGenerator,
    RefreshTokenGenerator,

    // Use Cases
    RegisterUseCase,
    ResendEmailVerificationUseCase,
    VerifyEmailUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    LoginWithEmailUseCase,
    ChangePasswordUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,

    // OAuth Use Cases
    GoogleAuthCallbackUseCase,

    // Use cases for token validation in the passport strategies
    ValidateAccessTokenUseCase,
    ValidateRefreshTokenUseCase
  ]
})
export class AuthModule { }