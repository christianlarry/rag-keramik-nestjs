import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { AuthRegisterDto } from "./dto/auth-register.dto";
import bcrypt from 'bcrypt';
import { PrismaService } from "../prisma/prisma.service";
import { AuthProvider, Role, UserStatus } from "src/generated/prisma/browser";
import { TokenService } from "../token/token.service";
import { MailService } from "../mail/mail.service";
import { AuthRegisterResponseDto } from "./dto/auth-register-response.dto";
import { ResendVerificationResponseDto } from "./dto/resend-verification-response.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly passwordSaltRounds: number = 10;

  // Implement authentication logic here
  constructor(
    private readonly usersService: UsersService,
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) { }

  async register(registerDto: AuthRegisterDto): Promise<AuthRegisterResponseDto> {
    // Check Email Availability
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }
    // Hash Password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create User Record
    const createdUser = await this.prismaService.$transaction(async (tx) => {
      const newUser = await this.usersService.create({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        gender: registerDto.gender,
        password: hashedPassword,
        role: Role.CUSTOMER,
        email: registerDto.email,
        emailVerified: false,
        status: UserStatus.INACTIVE,
        provider: AuthProvider.LOCAL,
        // Additional Profile Info
        address: registerDto.address
      }, tx)

      // Generate Verification Token & Send Verification Email
      await this.sendVerificationEmail(newUser.id, newUser.email, `${newUser.firstName} ${newUser.lastName}`);

      this.logger.log(`User registered successfully: ${newUser.id}`);

      return newUser
    })

    this.logger.log(`Registered user: ${createdUser.email}`);

    return new AuthRegisterResponseDto({
      id: createdUser.id,
      email: createdUser.email,
      firstName: createdUser.firstName!,
      lastName: createdUser.lastName!,
      message: 'User registered successfully. Please check your email to verify your account.',
    });
  }

  async verifyEmail(token: string): Promise<void> {
    this.logger.log(token)
  }

  async resendVerification(email: string): Promise<ResendVerificationResponseDto> {
    // 1. Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    // 2. Check if already verified
    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // 3. Generate new token & send verification email
    await this.sendVerificationEmail(user.id, user.email, `${user.firstName} ${user.lastName}`);

    return new ResendVerificationResponseDto({
      message: 'Verification email resent successfully.',
    });
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.passwordSaltRounds);
  }

  /**
   * Generate token and send verification email
   * @param userId 
   * @param email 
   * @param name 
   */
  private async sendVerificationEmail(userId: string, email: string, name: string) {
    // Generate Verification Token & Send Verification Email
    const token = await this.tokenService.generateEmailVerificationToken(userId, email);

    // Send Verification Email
    await this.mailService.sendVerificationEmail({
      to: email,
      name,
      token
    });
  }
}