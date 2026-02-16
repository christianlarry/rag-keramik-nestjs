import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { AuthProvider } from "../../domain/value-objects/auth-provider.vo";
import { AuthProvider as AuthProviderName } from "../../domain/enums/auth-provider.enum";
import { Name } from "src/modules/users/domain/value-objects/name.vo";
import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { AccessTokenGenerator } from "../../infrastructure/generator/access-token.generator";
import { RefreshTokenGenerator } from "../../infrastructure/generator/refresh-token.generator";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/core/infrastructure/services/audit/audit.service";
import { AuditAction } from "src/core/infrastructure/services/audit/enums/audit-action.enum";
import { AuditTargetType } from "src/core/infrastructure/services/audit/enums/audit-target-type.enum";

interface GoogleAuthCallbackCommand {
  user: {
    providerId: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  }
}

interface GoogleAuthCallbackResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  }
}

@Injectable()
export class GoogleAuthCallbackUseCase {

  private readonly logger = new Logger(GoogleAuthCallbackUseCase.name);

  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    private readonly accessTokenGenerator: AccessTokenGenerator,
    private readonly refreshTokenGenerator: RefreshTokenGenerator,

    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: UnitOfWork, // Replace with actual UnitOfWork type if you have it
    private readonly audit: AuditService, // Inject your AuditService if you have it for logging purposes
  ) { }

  async execute(command: GoogleAuthCallbackCommand): Promise<GoogleAuthCallbackResult> {

    // Check if user exists by providerId or email
    let authUser: AuthUser | null = await this.authUserRepository.findByEmail(command.user.email);

    if (authUser) {
      // Update provider if not already linked
      if (!authUser.hasProvider(AuthProviderName.GOOGLE)) {
        authUser.linkOAuth(AuthProvider.createGoogleProvider(command.user.providerId));
      }
    } else {
      // Create new user with OAuth provider
      authUser = AuthUser.fromOAuth({
        email: Email.create(command.user.email),
        name: Name.create(command.user.fullName),
        provider: AuthProvider.createGoogleProvider(command.user.providerId),
      });
    }

    const accessToken = await this.accessTokenGenerator.generate({
      userId: authUser.id.getValue(),
      email: authUser.email.getValue(),
      role: authUser.role.getValue(),
    });
    const refreshToken = await this.refreshTokenGenerator.generate({
      userId: authUser.id.getValue(),
    });

    await authUser.recordOAuthLogin(
      AuthProviderName.GOOGLE,
      refreshToken,
      { avatarUrl: command.user.avatarUrl }
    );

    await this.uow.withTransaction(async () => {
      await this.authUserRepository.save(authUser);

      await this.audit.logUserAction(
        authUser.id.getValue(),
        AuditAction.OAUTH_LOGIN,
        AuditTargetType.USER,
        authUser.id.getValue(),
        {
          provider: AuthProviderName.GOOGLE,
        }
      )
    })

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: {
        id: authUser.id.getValue(),
        email: authUser.email.getValue(),
        fullName: authUser.name.getFullName(),
      }
    }
  }
}