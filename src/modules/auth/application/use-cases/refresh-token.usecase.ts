import { Injectable } from "@nestjs/common";

interface RefreshTokenCommand {
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {

  constructor() { }

  async execute(command: RefreshTokenCommand): Promise<void> {
    // Implementation here ...
    // im doing it tomorrow
    // Notes for tomorrow:
    // 1. Validate the refresh token
    // 2. Generate new access token
    // 3. Optionally generate new refresh token for rotation
    // 4. Return the tokens
    // FIX Refresh Token Strategy validate method first
    // 🔥🔥🔥🔥🔥
  }
}