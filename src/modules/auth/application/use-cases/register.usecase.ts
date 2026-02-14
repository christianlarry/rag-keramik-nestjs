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
import { AuditAction } from "src/modules/audit/enums/audit-action.enum";
import { AuditTargetType } from "src/modules/audit/enums/audit-target-type.enum";
import { Name } from "src/modules/users/domain/value-objects/name.vo";
import { VerificationTokenRepository } from "../../infrastructure/repositories/email-verification-token.repository";
import { TOKEN_GENERATOR_TOKEN, type TokenGenerator } from "src/core/infrastructure/services/token-generator/interfaces/token-generator.interface";

interface RegisterCommand {
  // Auth Info
  fullName: string;
  email: string;
  password: string;
}

interface PostRegistrationTasksCommand {
  userId: string;
  name: string;
  email: string;
}

interface RegisterResult {
  userId: string;
}

@Injectable()
export class RegisterUseCase {

  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    private readonly verificationTokenRepository: VerificationTokenRepository,

    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: UnitOfWork,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: TokenGenerator,

    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) { }

  /**
   * Register a new user
   * @param command The registration command
   * @throws EmailAlreadyInUseError if the email is already registered
   */
  async execute(command: RegisterCommand): Promise<RegisterResult> {

    // Check for email uniqueness
    const exists = await this.authUserRepository.isEmailExisting(command.email);
    if (exists) throw new EmailAlreadyInUseError(command.email);

    // Validate and hash password
    Password.validateRaw(command.password);
    const hashedPassword = await this.passwordHasher.hash(command.password);

    // Create value objects
    const name: Name = Name.create(command.fullName);
    const password: Password = await Password.fromHash(hashedPassword);
    const email: Email = Email.create(command.email);
    const role: Role = Role.createCustomer();

    // Create user entity
    const authUser: AuthUser = AuthUser.register({
      name: name,
      email: email,
      password: password,
      role: role
    })

    // Transactional operations
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

      // Logger
      await this.logger.log(`New user registered with email: ${command.email}`);
    })

    // Post-registration tasks (e.g., sending verification email)
    await this.executePostRegistrationTasks({
      userId: authUser.id.getValue(),
      name: authUser.name.getFullName(),
      email: authUser.email.getValue(),
    });

    // Return result
    return { userId: authUser.id.getValue() };
  }

  async executePostRegistrationTasks(command: PostRegistrationTasksCommand): Promise<void> {
    const token = this.tokenGenerator.generateWithHash();

    // Save verification token to repository
    await this.verificationTokenRepository.save(token.hashed, command.userId)

    // Send verification email
    await this.mail.sendVerificationEmail({
      name: command.name,
      to: command.email,
      token: token.raw,
    });
  }
}