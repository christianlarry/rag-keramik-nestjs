import { Injectable, Logger } from "@nestjs/common";
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
import { JsonWebTokenError, TokenExpiredError as JwtTokenExpiredError } from "@nestjs/jwt";
import { AllConfigType } from "src/config/config.type";
import { ConfigService } from "@nestjs/config";
import { Environment } from "src/config/app/app-config.type";
import { AuditService } from "../audit/audit.service";
import { UserEmailAlreadyExistsError, UserEmailAlreadyVerifiedError } from "../users/errors";
import { TokenExpiredError, TokenInvalidError } from "../token/errors";

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

  /**
   * Register a new user
   * @param registerDto
   * @returns AuthRegisterResponseDto
   * @throws UserEmailAlreadyExistsError if email is already in use
   */
  async register(registerDto: AuthRegisterDto): Promise<AuthRegisterResponseDto> {
    // Check Email Availability
    const isEmailExist = await this.usersService.isEmailExists(registerDto.email);
    if (isEmailExist) {
      throw new UserEmailAlreadyExistsError(registerDto.email);
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

      // Generate Verification Token & Send Verification Email
      await this.sendVerificationEmail(newUser.id, newUser.email, `${newUser.firstName} ${newUser.lastName}`, newUser.emailVerified);

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

  async resendVerification(email: string): Promise<ResendVerificationResponseDto> {
    // 1. Find user by email
    const user = await this.usersService.findByEmail(email); // User not found handled by usersService

    // 2. Generate new token & send verification email
    await this.sendVerificationEmail(user.id, user.email, `${user.firstName} ${user.lastName}`, user.emailVerified);

    return new ResendVerificationResponseDto({
      message: 'Verification email resent successfully.',
    });
  }

  async verifyEmail(token: string): Promise<VerifyEmailResponseDto> {
    // 1. Verify Token, Handle Expired / Invalid Token
    const payload = await this.verifyVerificationEmailToken(token);

    // 2. Check if user already verified
    const user = await this.usersService.findById(payload.sub);

    // Already Verified
    if (user.emailVerified) {
      throw new UserEmailAlreadyVerifiedError(user.email);
    }

    // 3. Activate User Account, Set emailVerified = true, status = ACTIVE, emailVerifiedAt = now()
    await this.prismaService.$transaction(async (tx) => {
      const updatedUser = await this.usersService.markEmailAsVerified(payload.sub, tx);

      // Audit Log
      await this.auditService.logUserAction(
        updatedUser.id,
        AuditAction.EMAIL_VERIFICATION,
        AuditTargetType.USER,
        updatedUser.id,
        {
          email: updatedUser.email,
          verifiedAt: updatedUser.emailVerifiedAt,
          status: updatedUser.status
        },
        tx
      )
      // Send Welcome Email (Optional)
      await this.mailService.sendWelcomeEmail({
        to: updatedUser.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`
      });
    });

    return new VerifyEmailResponseDto({ message: 'Email verified successfully.' });
  }

  async forgotPassword() {
    // Implement forgot password logic
  }

  async resetPassword() {
    // Implement reset password logic
  }

  async login() {
    // Implement login logic
  }

  async logout() {
    // Implement logout logic
  }

  async refreshToken() {
    // Implement token refresh logic
  }


  // -- Helper Methods -- //
  private async verifyVerificationEmailToken(token: string): Promise<IEmailVerificationPayload> {
    try {
      const payload: IEmailVerificationPayload = await this.tokenService.verifyToken(token, TokenType.EMAIL_VERIFICATION);

      return payload;
    } catch (error) {
      // Log the error for debugging
      if (this.nodeEnv !== Environment.Production) {
        this.logger.error(`Email verification token is invalid or expired: ${error.message}`);
      }

      // Check JWT Error Type
      if (error instanceof JwtTokenExpiredError) {
        throw new TokenExpiredError('Email verification token has expired');
        // in http context, throw 
      };

      if (error instanceof JsonWebTokenError) {
        throw new TokenInvalidError('Email verification token is invalid');
      };

      throw new TokenInvalidError('Email verification token is invalid or expired');
    }
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
  private async sendVerificationEmail(
    userId: string,
    email: string,
    name: string,
    isEmailVerified: boolean,
  ) {
    // Prevent sending verification email to already verified users
    if (isEmailVerified) {
      throw new UserEmailAlreadyVerifiedError(email);
    }
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