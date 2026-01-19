import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthRegisterDto } from "./dto/auth-register.dto";
import { AuthRegisterResponseDto } from "./dto/response/auth-register-response.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { ResendVerificationResponseDto } from "./dto/response/resend-verification-response.dto";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { ResendVerificationThrottlerGuard } from "src/common/guards/throttler/resend-verification-throttler.guard";
import { LIMIT, TTL } from "src/common/constants/rate-limit.constants";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { VerifyEmailResponseDto } from "./dto/response/verify-email-response.dto";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: AuthRegisterDto
  ): Promise<AuthRegisterResponseDto> {
    return this.authService.register(registerDto)
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle() // Exempt from rate limiting to ensure email verification can proceed smoothly  
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto
  ): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ResendVerificationThrottlerGuard) // Track from Email level
  @Throttle({ default: { limit: LIMIT.VERY_STRICT, ttl: TTL.ONE_HOUR } }) // 3 requests per hour
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto
  ): Promise<ResendVerificationResponseDto> {
    return this.authService.resendVerification(resendVerificationDto.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.VERY_STRICT, ttl: TTL.ONE_HOUR } }) // 3 requests per hour
  async forgotPassword() {
    // Implement forgot password logic
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.MODERATE, ttl: TTL.ONE_HOUR } }) // 10 requests per hour
  async resetPassword() {
    // Implement reset password logic
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.STRICT, ttl: TTL.FIFTEEN_MINUTES } }) // 5 requests per 15 minutes
  async login() {
    // Implement login logic
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.LENIENT, ttl: TTL.ONE_MINUTE } }) // 20 requests per minute
  async logout() {
    // Implement logout logic
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.MODERATE, ttl: TTL.ONE_MINUTE } }) // 10 requests per minute
  async refreshToken() {
    // Implement token refresh logic
  }
}