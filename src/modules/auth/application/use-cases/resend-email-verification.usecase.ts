import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { AuthUserNotFoundError, CannotVerifyEmailError } from "../../domain/errors";
import { MailService } from "src/core/infrastructure/services/mail/mail.service";
import { TOKEN_GENERATOR_TOKEN, type TokenGenerator } from "src/core/infrastructure/services/token-generator/interfaces/token-generator.interface";
import { VerificationTokenRepository } from "../../infrastructure/repositories/email-verification-token.repository";

interface ResendEmailVerificationCommand {
  email: string;
}

@Injectable()
export class ResendEmailVerificationUseCase {

  private readonly logger = new Logger(ResendEmailVerificationUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly token: TokenGenerator,
    private readonly verificationTokenRepository: VerificationTokenRepository,

    private readonly mail: MailService,
  ) { }

  async execute(command: ResendEmailVerificationCommand): Promise<void> {
    const authUser = await this.authUserRepository.findByEmail(command.email);
    // Handle case where user is not found
    if (!authUser) {
      this.logger.warn(`Attempt to resend verification email to non-existent user with email: ${command.email}`);
      throw new AuthUserNotFoundError(`User with email ${command.email} not found.`);
    }

    // Check if user can verify email
    if (!authUser.canVerifyEmail()) {
      this.logger.warn(`Attempt to resend verification email to user who cannot verify email. User ID: ${authUser.id}`);
      throw new CannotVerifyEmailError(`User with ID ${authUser.id} cannot verify email.`);
    }

    // Generate new verification token
    const token = await this.token.generateWithHash();
    await this.verificationTokenRepository.save(token.hashed, authUser.id.getValue());

    // Resend verification email
    this.logger.log(`Resending email verification to user with email: ${command.email}`);
    await this.mail.sendVerificationEmail({
      to: authUser.email.getValue(),
      name: authUser.name.getFullName(),
      token: token.raw,
    })
  }
}