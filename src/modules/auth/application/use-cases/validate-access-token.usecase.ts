import { Inject, Injectable } from "@nestjs/common";
import { AccessTokenGenerator, AccessTokenPayload } from "../../infrastructure/generator/access-token.generator";
import { BlacklistedAccessTokenRepository } from "../../infrastructure/repositories/blacklisted-access-token.repository";
import { AccessTokenInvalidError } from "../../domain/errors";
import { AUTH_USER_QUERY_REPOSITORY_TOKEN, type AuthUserQueryRepository } from "../../domain/repositories/auth-user-query-repository.inteface";

interface ValidateAccessTokenCommand {
  tokenPayload: AccessTokenPayload;
}

interface ValidateAccessTokenResult {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

@Injectable()
export class ValidateAccessTokenUseCase {
  constructor(
    @Inject(AUTH_USER_QUERY_REPOSITORY_TOKEN)
    private readonly authUserQueryRepository: AuthUserQueryRepository,
    private readonly blacklistedAccessTokenRepository: BlacklistedAccessTokenRepository,
  ) { }

  async execute(command: ValidateAccessTokenCommand): Promise<ValidateAccessTokenResult> {
    const payload = command.tokenPayload;

    // Check token blacklisting
    const isBlacklisted = await this.blacklistedAccessTokenRepository.get(payload.jti);
    if (isBlacklisted) {
      throw new AccessTokenInvalidError('Access token has been revoked.');
    }

    // Validasi token type - hanya terima access token
    // Refresh token tidak boleh digunakan untuk access protected routes
    if (payload.type !== AccessTokenGenerator.TokenType) {
      throw new AccessTokenInvalidError('Invalid token type. Access token required.');
    }

    // Fetch user dari database
    const user = await this.authUserQueryRepository.getRequestedUserById(payload.sub);
    if (!user) {
      throw new AccessTokenInvalidError('Unauthorized access with invalid access token.');
    }

    // Object ini akan tersedia di request.user
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
  }
}