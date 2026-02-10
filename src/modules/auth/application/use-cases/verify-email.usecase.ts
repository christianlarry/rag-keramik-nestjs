import { Inject, Injectable, Logger } from "@nestjs/common";
import { TokenType } from "src/modules/token/enums/token-type.enum";
import { TokenInvalidError } from "src/modules/token/errors";
import { IEmailVerificationPayload } from "src/modules/token/interfaces/email-verification-payload.interface";
import { TokenService } from "src/modules/token/token.service";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { AuthUserNotFoundError } from "../../domain/errors";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/modules/audit/audit.service";
import { AuditAction, AuditTargetType } from "src/generated/prisma/enums";
import { MailService } from "src/modules/mail/mail.service";

interface VerifyEmailCommand {
  token: string;
}

interface PastVerifyEmailTasksCommand {
  email: string;
}

@Injectable()
export class VerifyEmailUseCase {

  private readonly logger = new Logger(VerifyEmailUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: UnitOfWork,

    private readonly token: TokenService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) { }

  async execute(command: VerifyEmailCommand): Promise<void> {
    // Verify the token and extract the payload
    const payload: IEmailVerificationPayload = await this.token.verifyToken(command.token, TokenType.EMAIL_VERIFICATION);
    if (payload.type !== TokenType.EMAIL_VERIFICATION) {
      throw new TokenInvalidError('Invalid token type');
    }

    // Find the user associated with the token
    const authUser = await this.authUserRepository.findById(payload.sub);
    if (!authUser) {
      throw new AuthUserNotFoundError(`User with ID ${payload.sub} not found`);
    }

    authUser.verifyEmail();

    await this.uow.withTransaction(async () => {
      await this.authUserRepository.save(authUser);

      await this.audit.logUserAction(
        authUser.id.getValue(),
        AuditAction.EMAIL_VERIFICATION,
        AuditTargetType.USER,
        authUser.id.getValue(),
        {
          email: authUser.email,
        }
      )

      this.logger.log(`User ${authUser.id.getValue()} has verified their email.`);
    })

    await this.executePostVerifyEmailTasks({
      email: authUser.email.getValue(),
    })
  }

  async executePostVerifyEmailTasks(command: PastVerifyEmailTasksCommand): Promise<void> {
    await this.mail.sendWelcomeEmail({
      to: command.email,
    })
  }
}