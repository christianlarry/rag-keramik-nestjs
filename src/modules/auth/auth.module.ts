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
import { PASSWORD_HASHER, PasswordHasher } from "./domain/hasher/password-hasher.interface";
import { BcryptPasswordHasher } from "./infrastructure/hasher/bcrypt-password.hasher";
import { AuthAccountMapper } from "./infrastructure/mapper/auth-account.mapper";
import { AUTH_ACCOUNT_REPOSITORY } from "./domain/repositories/auth-account-repository.interface";
import { PrismaAuthAccountRepository } from "./infrastructure/repositories/prisma-auth-account.repository";

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
    RefreshTokenStrategy,
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher
    },
    {
      provide: AuthAccountMapper,
      useFactory: (hasher: PasswordHasher) => {
        return new AuthAccountMapper(hasher);
      },
      inject: [PASSWORD_HASHER]
    },
    {
      provide: AUTH_ACCOUNT_REPOSITORY,
      useClass: PrismaAuthAccountRepository
    }
  ]
})
export class AuthModule { }