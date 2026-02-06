import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { EmailAlreadyInUseError } from "../../domain/errors";
import { Password } from "../../domain/value-objects/password.vo";
import { PASSWORD_HASHER_TOKEN, type PasswordHasher } from "../../domain/services/password-hasher.interface";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { Role } from "src/modules/users/domain/value-objects/role.vo";
import { MailService } from "src/modules/mail/mail.service";
import { AuditService } from "src/modules/audit/audit.service";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";

interface RegisterCommand {
  // Auth Info
  email: string;
  password: string;

  // User Profile Info
  firstName: string;
  lastName: string;
  gender: string;
  phone: string | null;
  dateOfBirth: Date | null;
  addresses: Array<{
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    isDefault: boolean | null;
  }>;
}

interface PostRegistrationTasksCommand {
  to: string;
  name: string;
  token: string;
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

    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) { }

  async execute(command: RegisterCommand): Promise<void> {
    // Check for email uniqueness
    const isEmailExist = await this.authUserRepository.isEmailExisting(command.email);

    if (isEmailExist) {
      throw new EmailAlreadyInUseError(command.email);
    }

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

    // TODO : Create user profile entity and link to auth user

    await this.uow.withTransaction(async () => {

      this.logger.debug(`Start transaction for registering user with email: ${command.email}`);

      // Save user
      await this.authUserRepository.save(authUser);
      // TODO: Save user profile

      // Audit log
      await this.auditService.logUserAction(
        authUser.id.getValue(),
        'REGISTER',
        'USER',
        authUser.id.getValue(),
        {
          email: authUser.email.getValue()
        }
      )
    });

    this.logger.debug(`Completed transaction for registering user with email: ${command.email}`);

    // Post registration tasks
    await this.executePostRegistrationTasks({
      to: authUser.email.getValue(),
      name: `${command.firstName} ${command.lastName}`,
      token: 'dummy-verification-token' // TODO: Generate real token
    });
  }

  async executePostRegistrationTasks(command: PostRegistrationTasksCommand): Promise<void> {
    // Send welcome email
    await this.mailService.sendVerificationEmail({
      to: command.to,
      name: command.name,
      token: command.token // TODO: Generate real token
    });

    // Other tasks can be added here (e.g., analytics, notifications, etc.)
  }
}