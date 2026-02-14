import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { AuthProvider } from "../../domain/value-objects/auth-provider.vo";

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
    const authUser: AuthUser | null = await this.authUserRepository.findByEmail(command.user.email);
    const provider = AuthProvider.createOAuthProvider('google', command.user.providerId)

    // If user exists, check if they are using the same provider or if they are using local provider. If they are using local provider, link their account to the new OAuth provider. If they are using a different OAuth provider, we can either throw an error or link the new provider to their existing account (depending on your business logic).

    // TODO : 2. If not, create new user with the provided info
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