import { Inject, Injectable } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { EmailAlreadyInUseError } from "../../domain/errors";
import { Password } from "../../domain/value-objects/password.vo";
import { PASSWORD_HASHER_TOKEN, type PasswordHasher } from "../../domain/services/password-hasher.interface";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { Role } from "src/modules/users/domain/value-objects/role.vo";
import { MailService } from "src/modules/mail/mail.service";
import { AuditService } from "src/modules/audit/audit.service";

interface RegisterCommand {
  // Auth Info
  email: string;
  password: string;

  // User Profile Info
  firstName: string;
  lastName: string;
  gender: string;
  phone: string | null;
  dateOfBirth: string | null;
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

@Injectable()
export class RegisterUseCase {

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
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

    // Save user
    await this.authUserRepository.save(authUser);
    // TODO : Save user profile in a transaction with auth user, Using uow pattern

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

    // TODO: Generate email verification token and save it in cache with TTL

    // Send welcome email
    await this.mailService.sendVerificationEmail({
      to: authUser.email.getValue(),
      name: `${command.firstName} ${command.lastName}`,
      token: 'dummy-verification-token' // TODO: Generate real token
    });
  }
}