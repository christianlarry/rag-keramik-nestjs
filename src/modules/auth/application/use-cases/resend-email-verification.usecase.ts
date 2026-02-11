import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { AuthUserNotFoundError, CannotVerifyEmailError } from "../../domain/errors";
import { MailService } from "src/modules/mail/mail.service";
import { TokenService } from "src/modules/token/token.service";

interface ResendEmailVerificationCommand {
  email: string;
}

@Injectable()
export class ResendEmailVerificationUseCase {

  private readonly logger = new Logger(ResendEmailVerificationUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,

    private readonly mail: MailService,
    private readonly token: TokenService,
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

    // Resend verification email
    this.logger.log(`Resending email verification to user with email: ${command.email}`);

    const token = await this.token.generateEmailVerificationToken(authUser.id.getValue(), authUser.email.getValue());
    await this.mail.sendVerificationEmail({
      to: authUser.email.getValue(),
      name: authUser.name.getFullName(),
      token: token,
    })
  }
}