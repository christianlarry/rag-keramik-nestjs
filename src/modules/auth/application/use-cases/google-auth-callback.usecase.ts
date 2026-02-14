import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { AuthProvider } from "../../domain/value-objects/auth-provider.vo";
import { Name } from "src/modules/users/domain/value-objects/name.vo";
import { Email } from "src/modules/users/domain/value-objects/email.vo";

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
    private readonly authUserRepository: AuthUserRepository
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

    await authUser.recordOAuthLogin('google', { avatarUrl: command.user.avatarUrl });
    await this.authUserRepository.save(authUser);

    // TODO : 3. Generate access and refresh tokens
    // TODO : 4. Return tokens and user info

    // For demonstration purposes, returning mock data
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: command.user.email,
        fullName: command.user.fullName
      }
    }
  }
}