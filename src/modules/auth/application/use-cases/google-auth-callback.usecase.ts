import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { AuthProvider } from "../../domain/value-objects/auth-provider.vo";
import { Name } from "src/modules/users/domain/value-objects/name.vo";
import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { AccessTokenGenerator } from "../../infrastructure/generator/access-token.generator";
import { RefreshTokenGenerator } from "../../infrastructure/generator/refresh-token.generator";
import { UNIT_OF_WORK_TOKEN, type UnitOfWork } from "src/core/application/unit-of-work.interface";
import { AuditService } from "src/modules/audit/audit.service";

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
      if (!authUser.hasProvider('google')) {
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

    // TODO : 3. Generate access and refresh tokens
    const accessToken = await this.accessTokenGenerator.generate({
      userId: authUser.id.getValue(),
      email: authUser.email.getValue(),
      role: authUser.role.getValue(),
    });
    const refreshToken = await this.refreshTokenGenerator.generate({
      userId: authUser.id.getValue(),
    });

    authUser.addRefreshToken(refreshToken);
    await authUser.recordOAuthLogin('google', { avatarUrl: command.user.avatarUrl });

    await this.uow.withTransaction(async () => {
      await this.authUserRepository.save(authUser);

      await this.audit.logUserAction(
        authUser.id.getValue(),

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