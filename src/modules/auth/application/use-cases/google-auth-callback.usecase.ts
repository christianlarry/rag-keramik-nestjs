import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";

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
    // Implement the logic for handling Google auth callback here
    this.logger.debug(`Executing GoogleAuthCallbackUseCase for user: ${command.user.email}`);
    this.logger.debug(`User details: ${JSON.stringify(command.user)}`);

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