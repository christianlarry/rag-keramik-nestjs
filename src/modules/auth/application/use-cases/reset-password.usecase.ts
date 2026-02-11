import { Inject, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { TokenInvalidError } from "src/modules/token/errors";
import { Password } from "../../domain/value-objects/password.vo";
import { PASSWORD_HASHER_TOKEN, type PasswordHasher } from "../../domain/services/password-hasher.interface";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/modules/audit/audit.service";
import { AuditAction, AuditTargetType } from "src/generated/prisma/enums";
import { MailService } from "src/modules/mail/mail.service";
import { PasswordResetRepository } from "../../infrastructure/repositories/password-reset.repository";

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
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: UnitOfWork,
    private readonly passwordResetRepository: PasswordResetRepository,

    private readonly audit: AuditService,
    private readonly mail: MailService,

  ) { }

  async execute(command: ResetPasswordCommand): Promise<void> {
    // Check token against cache to ensure it's valid and not used/revoked
    const cachedUserId = await this.passwordResetRepository.get<string>(command.token);
    if (!cachedUserId) {
      this.logger.warn(`Expired or invalid password reset token used for user ID ${cachedUserId} from IP ${command.ipAddress} with User-Agent ${command.userAgent}`);
      throw new TokenInvalidError('Invalid or Expired Reset Password Token');
    }

    // Find the user
    const authUser = await this.authUserRepository.findById(cachedUserId);
    if (!authUser) {
      this.logger.warn(`Password reset attempt for non-existent user ID ${cachedUserId} from IP ${command.ipAddress} with User-Agent ${command.userAgent}`);
      throw new TokenInvalidError(`Invalid Reset Password Token`); // Do not reveal user existence
    }

    // Create new Password VO
    const newPassword = await Password.create(command.newPassword, this.passwordHasher);

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
    await this.passwordResetRepository.invalidate(command.token);

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