import { Inject, Injectable } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { RefreshTokenGenerator, RefreshTokenPayload } from "../../infrastructure/generator/refresh-token.generator";
import { CannotRefreshTokenError } from "../../domain/errors";

interface ValidateRefreshTokenCommand {
  tokenPayload: RefreshTokenPayload;
  refreshToken: string;
}

interface ValidateRefreshTokenResult {
  id: string;
  email: string;
  role: string;
  fullName: string;
  refreshToken: string;
}

@Injectable()
export class ValidateRefreshTokenUseCase {

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
  ) { }

  async execute(command: ValidateRefreshTokenCommand): Promise<ValidateRefreshTokenResult> {

    const payload = command.tokenPayload;

    if (payload.type !== RefreshTokenGenerator.TokenType) {
      throw new CannotRefreshTokenError('Invalid token type. Refresh token required.');
    }

    const authUser = await this.authUserRepository.findById(payload.sub);
    if (!authUser) throw new CannotRefreshTokenError('Unauthorized access with invalid refresh token.'); // Do not reveal that the user does not exist for security reasons

    authUser.ensureCanRefreshToken();

    // Cek apakah refresh token valid, Jika tidak, hapus semua refresh token (logout dari semua device) Possible token theft
    if (!authUser.hasRefreshToken(command.refreshToken)) {
      authUser.clearRefreshTokens();
      await this.authUserRepository.save(authUser);

      throw new CannotRefreshTokenError('Refresh token is invalid or has been revoked');
    }

    return {
      id: authUser.id.getValue(),
      email: authUser.email.getValue(),
      role: authUser.role.getValue(),
      fullName: authUser.name.getFullName(),
      refreshToken: command.refreshToken,
    }
  }
}