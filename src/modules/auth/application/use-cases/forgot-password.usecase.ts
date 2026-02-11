import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { MailService } from "src/modules/mail/mail.service";
import { PasswordResetTokenRepository } from "../../infrastructure/repositories/password-reset-token.repository";

import crypto from 'crypto';

interface ForgotPasswordCommand {
  email: string;
}

@Injectable()
export class ForgotPasswordUseCase {

  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,

    private readonly mail: MailService,
  ) { }

  async execute(command: ForgotPasswordCommand): Promise<void> {
    // Find the user by email
    const authUser = await this.authUserRepository.findByEmail(command.email);

    if (authUser && authUser.canForgetPassword()) {
      // Generate password reset token
      const resetPasswordToken = await this.generateResetToken();

      // Save token to redis or similar with expiration for validation during reset
      await this.passwordResetTokenRepository.save(resetPasswordToken, authUser.id.getValue());

      // Send reset password email
      await this.mail.sendResetPasswordEmail({
        to: authUser.email.getValue(),
        name: authUser.name.getFullName(),
        token: resetPasswordToken,
      });
    }
  }

  private async generateResetToken(): Promise<string> {
    // Implement token generation logic here (Opaque token)
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return crypto.createHash('sha256').update(randomBytes).digest('hex');
  }
}