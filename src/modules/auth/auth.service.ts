import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { AuthRegisterDto } from "./dto/auth-register.dto";
import bcrypt from 'bcrypt';
import { PrismaService } from "../prisma/prisma.service";
import { AuditAction, AuditTargetType, AuthProvider, Role, UserStatus } from "src/generated/prisma/enums";
import { TokenService } from "../token/token.service";
import { MailService } from "../mail/mail.service";
import { AuthRegisterResponseDto } from "./dto/response/auth-register-response.dto";
import { ResendVerificationResponseDto } from "./dto/response/resend-verification-response.dto";
import { VerifyEmailResponseDto } from "./dto/response/verify-email-response.dto";
import { TokenType } from "../token/enums/token-type.enum";
import { IEmailVerificationPayload } from "../token/interfaces/email-verification-payload.interface";
import { JsonWebTokenError, TokenExpiredError } from "@nestjs/jwt";
import { AllConfigType } from "src/config/config.type";
import { ConfigService } from "@nestjs/config";
import { Environment } from "src/config/app/app-config.type";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly passwordSaltRounds: number = 10;
  private nodeEnv: Environment;

  // Implement authentication logic here
  constructor(
    private readonly usersService: UsersService,
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly auditService: AuditService,
  ) {
    this.nodeEnv = configService.getOrThrow<Environment>('app.nodeEnv', { infer: true }) as Environment;
  }

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

      // Audit Log
      await this.auditService.logUserAction(
        newUser.id,
        AuditAction.REGISTER,
        AuditTargetType.USER,
        newUser.id,
        {
          email: newUser.email,
          name: `${newUser.firstName} ${newUser.lastName}`,
        },
        tx
      )

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

  async verifyEmail(token: string): Promise<VerifyEmailResponseDto> {
    // 1. Verify Token, Handle Expired / Invalid Token
    const payload = await this.verifyEmailToken(token);

    // TODO 2. Check if user already verified
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // 3. Activate User Account, Set emailVerified = true, status = ACTIVE, emailVerifiedAt = now()
    await this.usersService.markEmailAsVerified(payload.sub);

    return new VerifyEmailResponseDto({ message: 'Email verified successfully.' });
  }

  private async verifyEmailToken(token: string): Promise<IEmailVerificationPayload> {
    try {
      const payload: IEmailVerificationPayload = await this.tokenService.verifyToken(token, TokenType.EMAIL_VERIFICATION);

      return payload;
    } catch (error) {
      // Log the error for debugging
      if (this.nodeEnv !== Environment.Production) {
        this.logger.error(`Email verification token is invalid or expired: ${error.message}`);
      }

      // Check JWT Error Type
      if (error instanceof TokenExpiredError) {
        throw new BadRequestException('Email verification token has expired');
      };

      if (error instanceof JsonWebTokenError) {
        throw new BadRequestException('Email verification token is invalid');
      };

      throw new BadRequestException('Email verification token is invalid or expired');
    }
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