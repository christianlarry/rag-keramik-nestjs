import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { PASSWORD_HASHER_TOKEN, type PasswordHasher } from "../../domain/services/password-hasher.interface";
import { InvalidCredentialsError } from "../../domain/errors";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/core/infrastructure/services/audit/audit.service";
import { AuditAction } from "src/core/infrastructure/services/audit/enums/audit-action.enum";
import { AuditTargetType } from "src/core/infrastructure/services/audit/enums/audit-target-type.enum";
import { AccessTokenGenerator } from "../../infrastructure/generator/access-token.generator";
import { RefreshTokenGenerator } from "../../infrastructure/generator/refresh-token.generator";

interface LoginWithEmailCommand {
  email: string;
  password: string;
}

interface LoginWithEmailResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  }
}

@Injectable()
export class LoginWithEmailUseCase {

  private readonly logger = new Logger(LoginWithEmailUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,

    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,

    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: UnitOfWork,

    private readonly audit: AuditService,
    private readonly accessTokenGenerator: AccessTokenGenerator,
    private readonly refreshTokenGenerator: RefreshTokenGenerator,
  ) { }

  async execute(command: LoginWithEmailCommand): Promise<LoginWithEmailResult> {
    // Find user by email & validate email exists
    const authUser = await this.authUserRepository.findByEmail(command.email);
    if (!authUser) throw new InvalidCredentialsError();

    authUser.ensureCanLogin();

    // Validate password
    const isPasswordValid = await this.passwordHasher.compare(command.password, authUser.password!.getValue());
    if (!isPasswordValid) throw new InvalidCredentialsError();

    // Token: Generate JWT and Refresh Token (handled elsewhere)
    const accessToken = await this.accessTokenGenerator.generate({
      email: authUser.email.getValue(),
      role: authUser.role.getValue(),
      userId: authUser.id.getValue(),
    })
    const refreshToken = await this.refreshTokenGenerator.generate({
      userId: authUser.id.getValue(),
    })

    // Save refresh token to user
    authUser.recordLogin(refreshToken);

    await this.uow.withTransaction(async () => {
      // Persist user changes
      await this.authUserRepository.save(authUser);

      // Audit
      await this.audit.logUserAction(
        authUser.id.getValue(),
        AuditAction.LOGIN,
        AuditTargetType.USER,
        authUser.id.getValue(),
      )
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: authUser.id.getValue(),
        email: authUser.email.getValue(),
        fullName: authUser.name.getFullName(),
      }
    };
  }
}