import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { EmailAlreadyInUseError } from "../../domain/errors";
import { Password } from "../../domain/value-objects/password.vo";
import { PASSWORD_HASHER_TOKEN, type PasswordHasher } from "../../domain/services/password-hasher.interface";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { Role } from "src/modules/users/domain/value-objects/role.vo";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/modules/audit/audit.service";
import { MailService } from "src/modules/mail/mail.service";
import { AuditAction, AuditTargetType } from "src/generated/prisma/enums";
import { TokenService } from "src/modules/token/token.service";

interface RegisterCommand {
  // Auth Info
  email: string;
  password: string;
}

@Injectable()
export class RegisterUseCase {

  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: UnitOfWork,

    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly token: TokenService
  ) { }

  /**
   * Register a new user
   * @param command The registration command
   * @throws EmailAlreadyInUseError if the email is already registered
   */
  async execute(command: RegisterCommand): Promise<void> {
    // Check for email uniqueness
    const exists = await this.authUserRepository.isEmailExisting(command.email);
    if (exists) throw new EmailAlreadyInUseError(command.email);

    // Create value objects
    const hashedPassword: Password = await Password.create(command.password, this.passwordHasher);
    const email: Email = Email.create(command.email);
    const role: Role = Role.createCustomer();

    // Create user entity
    const authUser: AuthUser = AuthUser.register({
      email: email,
      password: hashedPassword,
      role: role
    })

    // Save user
    await this.uow.withTransaction(async () => {
      // Save Auth User
      await this.authUserRepository.save(authUser);

      // Audit Log
      await this.audit.logUserAction(
        authUser.id.getValue(),
        AuditAction.REGISTER,
        AuditTargetType.USER,
        authUser.id.getValue(),
        {
          email: authUser.email.getValue(),
        }
      );

      await this.logger.log(`New user registered with email: ${command.email}`);
    })

    // Send verification email
    const token = await this.token.generateEmailVerificationToken(authUser.id.getValue(), authUser.email.getValue());
    await this.mail.sendVerificationEmail({
      to: authUser.email.getValue(),
      token: token,
    });
  }
}