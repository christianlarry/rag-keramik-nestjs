import { Controller, Get, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { LIMIT, TTL } from "src/common/constants/rate-limit.constants";
import { OAuthUser } from "./decorator/oauth-user.decorator";
import { type OAuthUser as OAuthUserInterface } from "./interfaces/oauth-user.interface";
import { GoogleAuthCallbackUseCase } from "../../application/use-cases/google-auth-callback.usecase";

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
  async googleAuth() { } // No need to implement anything here, as the guard will handle the redirection to Google

  @Get('callback')
  @UseGuards(AuthGuard('google'))
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.MODERATE, ttl: TTL.ONE_MINUTE } }) // 10 requests per minute
  async googleAuthCallback(
    @OAuthUser() user: OAuthUserInterface
  ) {
    await this.googleAuthCallbackUseCase.execute({
      user: {
        providerId: user.providerId,
        avatarUrl: user.picture,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    })
  }
}