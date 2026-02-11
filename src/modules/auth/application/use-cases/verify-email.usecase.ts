import { Inject, Injectable, Logger } from "@nestjs/common";
import { TokenInvalidError } from "src/modules/token/errors";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { AuthUserNotFoundError } from "../../domain/errors";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/modules/audit/audit.service";
import { AuditAction, AuditTargetType } from "src/generated/prisma/enums";
import { MailService } from "src/modules/mail/mail.service";
import { VerificationTokenRepository } from "../../infrastructure/repositories/email-verification-token.repository";
import { TOKEN_GENERATOR_TOKEN, type TokenGenerator } from "src/core/infrastructure/services/token-generator/interfaces/token-generator.interface";

interface VerifyEmailCommand {
  token: string;
}

interface PastVerifyEmailTasksCommand {
  email: string;
  name: string;
}

@Injectable()
export class VerifyEmailUseCase {

  private readonly logger = new Logger(VerifyEmailUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    private readonly verificationTokenRepository: VerificationTokenRepository,

    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: UnitOfWork,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: TokenGenerator,

    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) { }

  async execute(command: VerifyEmailCommand): Promise<void> {
    // Hash the provided token because we store only hashed tokens
    const hashedToken = this.tokenGenerator.hashToken(command.token);

    // Verify the token and extract the payload
    const cachedUserId = await this.verificationTokenRepository.get(hashedToken);
    if (!cachedUserId) {
      throw new TokenInvalidError('Email verification token is invalid or has expired');
    }

    // Find the user associated with the token
    const authUser = await this.authUserRepository.findById(cachedUserId);
    if (!authUser) {
      throw new AuthUserNotFoundError(`User with ID ${cachedUserId} not found`);
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
          email: authUser.email.getValue(),
        }
      )

      this.logger.log(`User ${authUser.id.getValue()} has verified their email.`);
    })

    await this.verificationTokenRepository.invalidate(hashedToken);

    await this.executePostVerifyEmailTasks({
      email: authUser.email.getValue(),
      name: authUser.name.getFullName(),
    })
  }

  async executePostVerifyEmailTasks(command: PastVerifyEmailTasksCommand): Promise<void> {
    await this.mail.sendWelcomeEmail({
      to: command.email,
      name: command.name
    })
  }
}