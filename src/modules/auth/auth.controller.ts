import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthRegisterDto } from "./dto/auth-register.dto";

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: AuthRegisterDto
  ): Promise<void> {
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
    @Body() resendVerificationDto: { email: string }
  ): Promise<void> {
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