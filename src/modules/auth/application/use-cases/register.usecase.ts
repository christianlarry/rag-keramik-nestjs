import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { EmailAlreadyInUseError } from "../../domain/errors";
import { Password } from "../../domain/value-objects/password.vo";
import { PASSWORD_HASHER_TOKEN, type PasswordHasher } from "../../domain/services/password-hasher.interface";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { Role } from "src/modules/users/domain/value-objects/role.vo";

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

@Injectable()
export class RegisterUseCase {

  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher
  ) { }

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
    await this.authUserRepository.save(authUser);

    // TODO : Added Event Publisher to publish UserRegisteredEvent
    // TODO : Handle AuditLog in Event Handler
    // TODO : Handle Post Registration Tasks in Event Handler, Send Verification Email, Welcome Email, etc.
  }
}