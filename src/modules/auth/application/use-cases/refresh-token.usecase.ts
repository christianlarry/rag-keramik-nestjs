import { Inject, Injectable } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { AuthUserNotFoundError } from "../../domain/errors";
import { AccessTokenGenerator } from "../../infrastructure/generator/access-token.generator";
import { RefreshTokenGenerator } from "../../infrastructure/generator/refresh-token.generator";

interface RefreshTokenCommand {
  userId: string;
  refreshToken: string;
}

interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    private readonly accessTokenGenerator: AccessTokenGenerator,
    private readonly refreshTokenGenerator: RefreshTokenGenerator,
  ) { }

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    const authUser = await this.authUserRepository.findById(command.userId);
    if (!authUser) {
      throw new AuthUserNotFoundError();
    }

    const newAccessToken = await this.accessTokenGenerator.generate({
      userId: authUser.id.getValue(),
      email: authUser.email.getValue(),
      role: authUser.role.getValue(),
    });
    const newRefreshToken = await this.refreshTokenGenerator.generate({
      userId: authUser.id.getValue(),
    });

    // Update refresh token in repository (token rotation)
    authUser.recordTokenRefresh(command.refreshToken, newRefreshToken);

    // Save updated auth user with new refresh token
    await this.authUserRepository.save(authUser);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}