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
import { UserEmailAlreadyExistsError, UserEmailAlreadyVerifiedError, UserNotFoundError } from "../users/errors";
import { TokenExpiredError, TokenInvalidError } from "../token/errors";
import { ForgotPasswordResponseDto } from "./dto/response/forgot-password-response.dto";
import { UserInvalidProviderError } from "../users/errors/user-invalid-provider.error";
import { IPasswordResetPayload } from "../token/interfaces/password-reset-payload.interface";
import { ResetPasswordResponseDto } from "./dto/response/reset-password-response.dto";
import { UserMapper } from "../users/domain/mappers/user.mapper";

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
    // Security: Always return success message to prevent email enumeration
    const responseMessage: string = 'If an account with that email exists, a verification email has been resent.'

    try {
      // 1. Find user by email
      const user = await this.usersService.findByEmail(email); // User not found handled by usersService

      // 2. Generate new token & send verification email
      await this.sendVerificationEmail(user.id, user.email, `${user.firstName} ${user.lastName}`, user.emailVerified);

      return new ResendVerificationResponseDto({
        message: responseMessage,
      });
    } catch (err) {
      if (err instanceof UserEmailAlreadyVerifiedError) {
        // Log the incident for monitoring
        this.logger.warn(`Resend verification requested for already verified email: ${email}`);
        return new ResendVerificationResponseDto({
          message: responseMessage,
        });
      }
      if (err instanceof UserNotFoundError) {
        // Log the incident for monitoring
        this.logger.warn(`Resend verification requested for non-existent email: ${email}`);
        return new ResendVerificationResponseDto({
          message: responseMessage,
        });
      }
      throw err
    }
  }

  async verifyEmail(token: string): Promise<VerifyEmailResponseDto> {
    // 1. Verify Token, Handle Expired / Invalid Token
    const payload = await this.verifyVerificationEmailToken(token);

    // 2. Check if user already verified
    const user = await this.usersService.findById(payload.sub);

    // Already Verified
    // If already verifed, the provider check is not needed
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

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    // Implement forgot password logic
    // Security: Always return a success message to prevent email enumeration
    const responseMessage: string = 'If an account with that email exists, a password reset link has been sent.'

    try {
      // Check if user exists by email
      const user = await this.usersService.findByEmail(email);

      // Check provider
      if (user.provider !== AuthProvider.LOCAL) {
        throw new UserInvalidProviderError(`This account uses ${user.provider} login. Please use '${user.provider}' to sign in.`);
      }

      // Check Password Existence
      if (!user.password) {
        throw new TokenInvalidError('Password reset token is invalid');
      }

      // Generate password reset token with Dynamic Secret (using user's current hashed password)
      const passwordResetToken = await this.tokenService.generatePasswordResetToken(user.id, user.password);

      //Send password reset email
      await this.mailService.sendResetPasswordEmail({
        to: user.email,
        name: `${user.firstName} ${user.lastName}`,
        token: passwordResetToken
      });

      // Return Response DTO
      return new ForgotPasswordResponseDto({ message: responseMessage });

    } catch (err) {
      if (err instanceof UserNotFoundError) {
        // Log the incident for monitoring
        this.logger.warn(`Password reset requested for non-existent email: ${email}`);
        return new ForgotPasswordResponseDto({ message: responseMessage });
      }
      if (err instanceof UserInvalidProviderError) {
        // Log the incident for monitoring
        this.logger.warn(`Password reset requested for email with invalid provider: ${email}`);
        return new ForgotPasswordResponseDto({ message: responseMessage });
      }

      // Re-throw other unexpected errors
      throw err;
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ResetPasswordResponseDto> {
    try {
      // Decode to get userId without verifying
      const decoded: IPasswordResetPayload | null = await this.tokenService.decodeToken(token);

      // Validate decoded token
      if (!decoded || !decoded.sub) {
        throw new TokenInvalidError('Password reset token is invalid');
      }

      // Check Token Type
      if (decoded.type !== TokenType.PASSWORD_RESET) {
        throw new TokenInvalidError('Password reset token is invalid');
      }

      // Get user current hash password for dynamic secret
      const user = await this.usersService.findByIdSelective(decoded.sub, ['password', 'email', 'firstName', 'lastName', 'provider']);

      // Check provider
      if (user.provider !== AuthProvider.LOCAL) {
        throw new UserInvalidProviderError(`This account uses ${user.provider} login. Please use '${user.provider}' to sign in.`);
      }

      // Check Password Existence
      if (!user.password) {
        throw new TokenInvalidError('Password reset token is invalid');
      }

      // Verify Token
      await this.tokenService.verifyToken(token, TokenType.PASSWORD_RESET, user.password);

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      await this.prismaService.$transaction(async (tx) => {
        // Update Password
        await this.usersService.updatePassword(
          decoded.sub,
          hashedPassword,
          tx
        );

        // Clear all existing refresh tokens
        await this.usersService.clearRefreshTokens(
          decoded.sub,
          tx
        );

        // Insert to AuditLog
        await this.auditService.logUserAction(
          decoded.sub,
          AuditAction.PASSWORD_RESET,
          AuditTargetType.USER,
          decoded.sub,
          {
            email: user.email,
          },
          tx
        );

        // Send Email
        await this.mailService.sendPasswordChangedEmail({
          changedAt: new Date(),
          to: user.email!,
          name: `${user.firstName} ${user.lastName}`,
          ipAddress: ipAddress,
          userAgent: userAgent,
        });
      })

      return new ResetPasswordResponseDto({ message: 'Password has been reset successfully.' });

    } catch (err) {
      // Handle token errors
      if (err instanceof JwtTokenExpiredError) {
        throw new TokenExpiredError('Password reset token has expired');
      }
      if (err instanceof JsonWebTokenError) {
        throw new TokenInvalidError('Password reset token is invalid');
      }

      // Re-throw known errors
      if (err instanceof TokenInvalidError ||
        err instanceof TokenExpiredError ||
        err instanceof UserInvalidProviderError) {
        throw err;
      }

      // Log unexpected errors
      this.logger.error(`Unexpected error in resetPassword: ${err.message}`);
      throw new TokenInvalidError('Password reset token is invalid or expired');
    }
  }

  async loginWithEmail(email: string, password: string) {

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
      if (payload.type !== TokenType.EMAIL_VERIFICATION) {
        throw new TokenInvalidError('Email verification token is invalid');
      }

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