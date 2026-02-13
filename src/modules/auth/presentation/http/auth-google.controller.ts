import { Controller, Get, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { LIMIT, TTL } from "src/common/constants/rate-limit.constants";
import { OAuthUser } from "./decorator/oauth-user.decorator";
import { type OAuthUser as OAuthUserInterface } from "./interfaces/oauth-user.interface";
import { GoogleAuthCallbackUseCase } from "../../application/use-cases/google-auth-callback.usecase";
import { AuthGoogleCallbackResponseDto } from "./dtos/response/auth-google-callback-response.dto";

@ApiTags('Auth')
@Controller('auth/google')
export class AuthGoogleController {
  constructor(
    private readonly googleAuthCallbackUseCase: GoogleAuthCallbackUseCase,
  ) { }

  @Get()
  @UseGuards(AuthGuard('google'))
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.MODERATE, ttl: TTL.ONE_MINUTE } }) // 10 requests per minute
  @ApiOperation({ summary: 'Initiate Google OAuth login', description: 'Redirects the user to Google for authentication.' })
  @ApiResponse({ status: 200, description: 'Redirects to Google for authentication.' })
  async googleAuth() { } // No need to implement anything here, as the guard will handle the redirection to Google

  @Get('callback')
  @UseGuards(AuthGuard('google'))
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.MODERATE, ttl: TTL.ONE_MINUTE } }) // 10 requests per minute
  @ApiOperation({ summary: 'Handle Google OAuth callback', description: 'Processes the callback from Google OAuth and returns authentication tokens.' })
  @ApiResponse({ status: 200, description: 'Authentication successful.', type: AuthGoogleCallbackResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication failed.' })
  async googleAuthCallback(
    @OAuthUser() user: OAuthUserInterface
  ): Promise<AuthGoogleCallbackResponseDto> {
    const result = await this.googleAuthCallbackUseCase.execute({
      user: {
        providerId: user.providerId,
        avatarUrl: user.picture,
        email: user.email,
        fullName: user.fullName,
      }
    })

    return new AuthGoogleCallbackResponseDto({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
      }
    });
  }
}