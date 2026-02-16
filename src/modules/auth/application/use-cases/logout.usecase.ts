import { Inject, Injectable } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/core/infrastructure/services/audit/audit.service";
import { AuditAction } from "src/core/infrastructure/services/audit/enums/audit-action.enum";
import { AuditTargetType } from "src/core/infrastructure/services/audit/enums/audit-target-type.enum";
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
    // Blacklist the access token by saving its jti to the blacklist repository
    const accessDecoded = await this.accessTokenGenerator.decode(command.accessToken);
    const accessTokenJti = accessDecoded.jti;
    const blacklistExpirationInSeconds = accessDecoded.exp ? accessDecoded.exp - Math.floor(Date.now() / 1000) : 60 * 15;

    await this.blacklistedAccessTokenRepository.save(accessTokenJti, blacklistExpirationInSeconds);

    // Find the user by ID
    const authUser = await this.authUserRepository.findById(command.userId);
    if (authUser) {
      // Invalidate the user's refresh token
      authUser.recordLogout(command.refreshToken);

      // Save the updated user entity
      await this.uow.withTransaction(async () => {
        await this.authUserRepository.save(authUser);

        await this.audit.logUserAction(
          command.userId,
          AuditAction.LOGOUT,
          AuditTargetType.USER,
          command.userId,
        )
      });
    }
  }
}