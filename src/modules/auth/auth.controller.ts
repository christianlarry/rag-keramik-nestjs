import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
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
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import type { Request } from "express";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { JwtRefreshGuard } from "src/common/guards/jwt-refresh.guard";
import { AuthLoginDto } from "./dto/auth-login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { User } from "src/common/decorator/user.decorator";
import { RegisterUseCase } from "./application/use-cases/register.usecase";
import { ResendEmailVerificationUseCase } from "./application/use-cases/resend-email-verification.usecase";
import { VerifyEmailUseCase } from "./application/use-cases/verify-email.usecase";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,

    // Use Cases
    private readonly registerUseCase: RegisterUseCase,
    private readonly resendEmailVerificationUseCase: ResendEmailVerificationUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
  ) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: LIMIT.STRICT, ttl: TTL.FIFTEEN_MINUTES } }) // 5 requests per 15 minutes
  async register(
    @Body() registerDto: AuthRegisterDto
  ): Promise<AuthRegisterResponseDto> {
    const result = await this.registerUseCase.execute({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: registerDto.password,
    });

    return new AuthRegisterResponseDto({
      message: 'Registration successful. Please check your email to verify your account.',
      id: result.userId,
    });
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle() // Exempt from rate limiting to ensure email verification can proceed smoothly  
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto
  ): Promise<VerifyEmailResponseDto> {
    await this.verifyEmailUseCase.execute({
      token: verifyEmailDto.token,
    });

    return new VerifyEmailResponseDto({
      message: 'Email verified successfully. Your account is now active.'
    });
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ResendVerificationThrottlerGuard) // Track from Email level
  @Throttle({ default: { limit: LIMIT.VERY_STRICT, ttl: TTL.ONE_HOUR } }) // 3 requests per hour
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto
  ): Promise<ResendVerificationResponseDto> {
    await this.resendEmailVerificationUseCase.execute({
      email: resendVerificationDto.email,
    });

    return new ResendVerificationResponseDto({
      message: 'Verification email resent. Please check your email.'
    });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.VERY_STRICT, ttl: TTL.ONE_HOUR } }) // 3 requests per hour
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto
  ) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.MODERATE, ttl: TTL.ONE_HOUR } }) // 10 requests per hour
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request
  ) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
      req.ip,
      req.headers["user-agent"] as string | undefined
    );
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.MODERATE, ttl: TTL.ONE_HOUR } }) // 10 requests per hour
  @UseGuards(JwtAuthGuard) // Must be authenticated
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @User('id') userId: string
  ) {
    return this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.STRICT, ttl: TTL.FIFTEEN_MINUTES } }) // 5 requests per 15 minutes
  async login(@Body() loginDto: AuthLoginDto) {
    return this.authService.loginWithEmail(loginDto.email, loginDto.password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.LENIENT, ttl: TTL.ONE_MINUTE } }) // 20 requests per minute
  @UseGuards(JwtAuthGuard) // Must be authenticated
  async logout(@User('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.MODERATE, ttl: TTL.ONE_MINUTE } }) // 10 requests per minute
  @UseGuards(JwtRefreshGuard) // Must have a valid refresh token
  async refreshToken() {
    // Implement token refresh logic
  }
}