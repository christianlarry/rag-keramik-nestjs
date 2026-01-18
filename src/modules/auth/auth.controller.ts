import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthRegisterDto } from "./dto/auth-register.dto";
import { AuthRegisterResponseDto } from "./dto/auth-register-response.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { ResendVerificationResponseDto } from "./dto/resend-verification-response.dto";

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
  async verifyEmail(
    @Body() verifyEmailDto: { token: string }
  ): Promise<void> {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto
  ): Promise<ResendVerificationResponseDto> {
    return this.authService.resendVerification(resendVerificationDto.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword() {
    // Implement forgot password logic
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword() {
    // Implement reset password logic
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login() {
    // Implement login logic
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    // Implement logout logic
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken() {
    // Implement token refresh logic
  }
}