import { Inject, Logger } from "@nestjs/common";
import { TokenService } from "src/modules/token/token.service";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { IPasswordResetPayload } from "src/modules/token/interfaces/password-reset-payload.interface";
import { TokenType } from "src/modules/token/enums/token-type.enum";
import { TokenInvalidError } from "src/modules/token/errors";
import { AuthUserNotFoundError } from "../../domain/errors";
import { Password } from "../../domain/value-objects/password.vo";
import { PASSWORD_HASHER_TOKEN, type PasswordHasher } from "../../domain/services/password-hasher.interface";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/modules/audit/audit.service";
import { AuditAction, AuditTargetType } from "src/generated/prisma/enums";
import { MailService } from "src/modules/mail/mail.service";

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

    private readonly token: TokenService,
    private readonly audit: AuditService,
    private readonly mail: MailService

  ) { }

  async execute(command: ResetPasswordCommand): Promise<void> {
    const payload: IPasswordResetPayload = await this.token.verifyToken(command.token, TokenType.PASSWORD_RESET);
    // Validate the token
    if (
      payload.type !== TokenType.PASSWORD_RESET
    ) {
      this.logger.warn(`Invalid password reset token used from IP ${command.ipAddress} with User-Agent ${command.userAgent}`);
      throw new TokenInvalidError('Invalid Reset Password Token');
    }

    // Find the user
    const authUser = await this.authUserRepository.findById(payload.sub);
    if (!authUser) {
      this.logger.warn(`Password reset attempt for non-existent user ID ${payload.sub} from IP ${command.ipAddress} with User-Agent ${command.userAgent}`);
      throw new AuthUserNotFoundError(`User with ID ${payload.sub} not found`);
    }

    // Create new Password VO
    const passwordVO = await Password.create(command.newPassword, this.passwordHasher)

    // Reset the user's password
    authUser.resetPassword(passwordVO);

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