import { Inject, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { TokenInvalidError } from "src/modules/token/errors";
import { Password } from "../../domain/value-objects/password.vo";
import { PASSWORD_HASHER_TOKEN, type PasswordHasher } from "../../domain/services/password-hasher.interface";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/modules/audit/audit.service";
import { AuditAction } from "src/modules/audit/enums/audit-action.enum";
import { AuditTargetType } from "src/modules/audit/enums/audit-target-type.enum";
import { MailService } from "src/modules/mail/mail.service";
import { PasswordResetTokenRepository } from "../../infrastructure/repositories/password-reset-token.repository";
import { TOKEN_GENERATOR_TOKEN, type TokenGenerator } from "src/core/infrastructure/services/token-generator/interfaces/token-generator.interface";
import { CannotResetPasswordError } from "../../domain/errors";

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
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,

    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: UnitOfWork,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: TokenGenerator,

    private readonly audit: AuditService,
    private readonly mail: MailService,

  ) { }

  async execute(command: ResetPasswordCommand): Promise<void> {

    // Validate New Password - Ensure it before any processing
    Password.validateRaw(command.newPassword);

    // Hash token becauase stored token is hashed
    const hashedToken = this.tokenGenerator.hashToken(command.token);

    // Validate token and get user ID
    const cachedUserId = await this.passwordResetTokenRepository.get<string>(hashedToken);
    if (!cachedUserId) {
      this.logger.warn(`Expired or invalid password reset token used for user ID ${cachedUserId} from IP ${command.ipAddress} with User-Agent ${command.userAgent}`);
      throw new TokenInvalidError('Invalid or Expired Reset Password Token');
    }

    // Find the user
    const authUser = await this.authUserRepository.findById(cachedUserId);
    if (!authUser) {
      this.logger.warn(`Password reset attempt for non-existent user ID ${cachedUserId} from IP ${command.ipAddress} with User-Agent ${command.userAgent}`);
      throw new TokenInvalidError('Invalid or Expired Reset Password Token'); // Do not reveal user existence
    }

    // Ensure user can reset password
    authUser.ensureCanResetPassword();

    // Validate that the new password is different from the old one
    const isSamePassword = await this.passwordHasher.compare(command.newPassword, authUser.password!.getValue());
    if (isSamePassword) {
      this.logger.warn(`User ID ${authUser.id.getValue()} attempted to reset to the same password from IP ${command.ipAddress} with User-Agent ${command.userAgent}`);
      throw new CannotResetPasswordError('New password must be different from the old password');
    }

    // Create new Password VO
    const hashedNewPassword = await this.passwordHasher.hash(command.newPassword);
    const newPassword = await Password.fromHash(hashedNewPassword);

    // Reset the user's password
    authUser.resetPassword(newPassword);

    // Save the user
    await this.uow.withTransaction(async () => {
      await this.authUserRepository.save(authUser);

      await this.audit.logUserAction(
        authUser.id.getValue(),
        AuditAction.PASSWORD_RESET,
        AuditTargetType.USER,
        authUser.id.getValue()
      );
    })

    // Remove the token from cache to prevent reuse
    await this.passwordResetTokenRepository.invalidate(hashedToken);

    this.logger.log(`Password reset successfully for user ID ${authUser.id.getValue()} from IP ${command.ipAddress} with User-Agent ${command.userAgent}`);

    // Optionally, you could send a confirmation email here
    await this.mail.sendPasswordChangedEmail({
      to: authUser.email.getValue(),
      changedAt: new Date(),
      name: authUser.name.getFullName(),
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
    })
  }
}