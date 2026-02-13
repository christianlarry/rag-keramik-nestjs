import { Inject, Injectable } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { AccessTokenGenerator, AccessTokenPayload } from "../../infrastructure/generator/access-token.generator";
import { BlacklistedAccessTokenRepository } from "../../infrastructure/repositories/blacklisted-access-token.repository";
import { Role } from "src/modules/users/domain/enums/role.enum";
import { AccessTokenInvalidError } from "../../domain/errors";

interface ValidateAccessTokenCommand {
  tokenPayload: AccessTokenPayload;
}

interface ValidateAccessTokenResult {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

@Injectable()
export class ValidateAccessTokenUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
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
    const authUser = await this.authUserRepository.findById(payload.sub);
    if (!authUser) {
      throw new AccessTokenInvalidError('Unauthorized access with invalid access token.');
    }

    authUser.ensureCanLogin();

    // Object ini akan tersedia di request.user
    return {
      id: authUser.id.getValue(),
      email: authUser.email.getValue(),
      role: authUser.role.getValue(),
      fullName: authUser.name.getFullName(),
    };
  }
}