import { Inject, Injectable } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/modules/audit/audit.service";
import { AuditAction, AuditTargetType } from "src/generated/prisma/enums";
import { BlacklistedAccessTokenRepository } from "../../infrastructure/repositories/blacklisted-access-token.repository";
import { AccessTokenGenerator } from "../../infrastructure/generator/access-token.generator";

interface LogoutCommand {
  userId: string;
  refreshToken: string;
  accessToken: string;
}

@Injectable()
export class LogoutUseCase {

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    private readonly blacklistedAccessTokenRepository: BlacklistedAccessTokenRepository,

    private readonly accessTokenGenerator: AccessTokenGenerator,

    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: UnitOfWork,
    private readonly audit: AuditService
  ) { }

  async execute(command: LogoutCommand): Promise<void> {
    // Find the user by ID
    const authUser = await this.authUserRepository.findById(command.userId);
    if (!authUser) {
      return; // If user not found, simply return
    }

    // Invalidate the refresh token
    authUser.removeRefreshToken(command.refreshToken);

    // Blacklist the access token (implementation depends on your token management strategy)
    const accessDecoded = await this.accessTokenGenerator.decode(command.accessToken);
    const accessTokenJti = accessDecoded.jti;
    const blacklistExpirationInSeconds = accessDecoded.exp ? accessDecoded.exp - Math.floor(Date.now() / 1000) : 60 * 15;

    await this.blacklistedAccessTokenRepository.save(accessTokenJti, blacklistExpirationInSeconds);

    // Save the updated user entity
    await this.uow.withTransaction(async () => {
      await this.authUserRepository.save(authUser);

      await this.audit.logUserAction(
        authUser.id.getValue(),
        AuditAction.LOGOUT,
        AuditTargetType.USER,
        authUser.id.getValue(),
      )
    });
  }
}