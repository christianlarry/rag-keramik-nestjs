import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RegisterUseCase } from "../../application/use-cases/register.usecase";
import { ResendEmailVerificationUseCase } from "../../application/use-cases/resend-email-verification.usecase";
import { VerifyEmailUseCase } from "../../application/use-cases/verify-email.usecase";
import { ForgotPasswordUseCase } from "../../application/use-cases/forgot-password.usecase";
import { ResetPasswordUseCase } from "../../application/use-cases/reset-password.usecase";
import { LoginWithEmailUseCase } from "../../application/use-cases/login-with-email.usecase";
import { LogoutUseCase } from "../../application/use-cases/logout.usecase";
import { RefreshTokenUseCase } from "../../application/use-cases/refresh-token.usecase";
import { ChangePasswordUseCase } from "../../application/use-cases/change-password.usecase";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { LIMIT, TTL } from "src/common/constants/rate-limit.constants";
import { AuthRegisterDto } from "./dtos/auth-register.dto";
import { AuthRegisterResponseDto } from "./dtos/response/auth-register-response.dto";
import { VerifyEmailDto } from "./dtos/verify-email.dto";
import { VerifyEmailResponseDto } from "./dtos/response/verify-email-response.dto";
import { ResendVerificationThrottlerGuard } from "src/common/guards/resend-verification-throttler.guard";
import { ResendVerificationDto } from "./dtos/resend-verification.dto";
import { ResendVerificationResponseDto } from "./dtos/response/resend-verification-response.dto";
import { ForgotPasswordDto } from "./dtos/forgot-password.dto";
import { ForgotPasswordResponseDto } from "./dtos/response/forgot-password-response.dto";
import { ResetPasswordDto } from "./dtos/reset-password.dto";
import { ResetPasswordResponseDto } from "./dtos/response/reset-password-response.dto";
import { type Request } from "express";
import { JwtAuthGuard } from "src/modules/auth/presentation/http/guard/jwt-auth.guard";
import { User } from "src/modules/auth/presentation/http/decorator/user.decorator";
import { ChangePasswordDto } from "./dtos/change-password.dto";
import { AuthLoginDto } from "./dtos/auth-login.dto";
import { AuthLoginResponseDto } from "./dtos/response/auth-login-response.dto";
import { JwtRefreshGuard } from "src/modules/auth/presentation/http/guard/jwt-refresh.guard";
import { ChangePasswordResponseDto } from "./dtos/response/change-password-response.dto";
import { AuthLogoutResponseDto } from "./dtos/response/auth-logout-response.dto";
import { RefreshTokenResponseDto } from "./dtos/response/refresh-token-response.dto";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    // Use Cases
    private readonly registerUseCase: RegisterUseCase,
    private readonly resendEmailVerificationUseCase: ResendEmailVerificationUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly loginWithEmailUseCase: LoginWithEmailUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: LIMIT.STRICT, ttl: TTL.FIFTEEN_MINUTES } }) // 5 requests per 15 minutes
  async register(
    @Body() registerDto: AuthRegisterDto
  ): Promise<AuthRegisterResponseDto> {
    const result = await this.registerUseCase.execute({
      fullName: registerDto.fullName,
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
  ): Promise<ForgotPasswordResponseDto> {
    await this.forgotPasswordUseCase.execute({
      email: forgotPasswordDto.email,
    });

    return new ForgotPasswordResponseDto({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.MODERATE, ttl: TTL.ONE_HOUR } }) // 10 requests per hour
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request
  ): Promise<ResetPasswordResponseDto> {
    await this.resetPasswordUseCase.execute({
      token: resetPasswordDto.token,
      newPassword: resetPasswordDto.newPassword,
      ipAddress: req.ip ?? '',
      userAgent: req.headers["user-agent"] as string ?? '',
    });

    return new ResetPasswordResponseDto({
      message: 'Password has been reset successfully.'
    });
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.MODERATE, ttl: TTL.ONE_HOUR } }) // 10 requests per hour
  @UseGuards(JwtAuthGuard) // Must be authenticated
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @User('id') userId: string
  ) {
    await this.changePasswordUseCase.execute({
      userId: userId,
      currentPassword: changePasswordDto.currentPassword,
      newPassword: changePasswordDto.newPassword,
    })

    return new ChangePasswordResponseDto({
      message: 'Password changed successfully.'
    })
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.STRICT, ttl: TTL.FIFTEEN_MINUTES } }) // 5 requests per 15 minutes
  async login(@Body() loginDto: AuthLoginDto): Promise<AuthLoginResponseDto> {
    const result = await this.loginWithEmailUseCase.execute({
      email: loginDto.email,
      password: loginDto.password,
    })

    return new AuthLoginResponseDto({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        'id': result.user.id,
        'email': result.user.email,
        'fullName': result.user.fullName,
      }
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.LENIENT, ttl: TTL.ONE_MINUTE } }) // 20 requests per minute
  @UseGuards(JwtAuthGuard) // Must be authenticated
  async logout(
    @User('id') userId: string,
    @Req() req: Request
  ): Promise<AuthLogoutResponseDto> {

    await this.logoutUseCase.execute({
      userId: userId,
      accessToken: req.headers['authorization']?.replace('Bearer ', '') ?? '',
      refreshToken: req.cookies['refreshToken'] ?? req.body.refreshToken ?? '',
    })

    return new AuthLogoutResponseDto({
      message: 'Logged out successfully.'
    })
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: LIMIT.MODERATE, ttl: TTL.ONE_MINUTE } }) // 10 requests per minute
  @UseGuards(JwtRefreshGuard) // Must have a valid refresh token
  async refreshToken(
    @User('refreshToken') refreshToken: string,
    @User('id') userId: string
  ): Promise<RefreshTokenResponseDto> {

    const result = await this.refreshTokenUseCase.execute({
      refreshToken,
      userId
    });

    return new RefreshTokenResponseDto({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  }
}