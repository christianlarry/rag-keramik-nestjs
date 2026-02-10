import { Inject, Logger } from "@nestjs/common";
import { TokenService } from "src/modules/token/token.service";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { IPasswordResetPayload } from "src/modules/token/interfaces/password-reset-payload.interface";
import { TokenType } from "src/modules/token/enums/token-type.enum";
import { TokenInvalidError } from "src/modules/token/errors";

interface ResetPasswordCommand {
  token: string;
  newPassword: string;
  ipAddress: string;
  userAgent: string;
}

export class ResetPasswordUseCase {
  private readonly logger = new Logger(ResetPasswordUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    private readonly token: TokenService,

  ) { }

  async execute(command: ResetPasswordCommand): Promise<void> {
    const decoded: IPasswordResetPayload | null = await this.token.decodeToken(command.token);
    // Validate the token
    if (!decoded || !decoded.sub || decoded.type !== TokenType.PASSWORD_RESET) {
      this.logger.warn(`Invalid password reset token used from IP ${command.ipAddress} with User-Agent ${command.userAgent}`);
      throw new TokenInvalidError('Invalid Reset Password Token');
    }

    const authUser = await this.authUserRepository.findById(decoded.sub);

    // TODO: Implement password reset logic here
    // TODO: Met Pagii


  }
}