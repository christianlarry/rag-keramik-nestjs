import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JsonWebTokenError, JwtService, JwtSignOptions, TokenExpiredError as JwtTokenExpiredError } from "@nestjs/jwt";
import { AllConfigType } from "src/config/config.type";
import { TokenType } from "./enums/token-type.enum";
import { IEmailVerificationPayload } from "./interfaces/email-verification-payload.interface";
import { IPasswordResetPayload } from "./interfaces/password-reset-payload.interface";
import { Role } from "src/generated/prisma/enums";
import { IAccessPayload } from "./interfaces/access-payload.interface";
import { IRefreshPayload } from "./interfaces/refresh-payload.interface";
import { TokenExpiredError, TokenInvalidError } from "./errors";

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>
  ) { }

  /**
   * Generate token based on type
   * @param payload - Payload to include in the token
   * @param type - Type of token to generate
   * @param dynamicSecretSuffix - Optional suffix for dynamic secret generation (e.g., for password reset)
   */
  private async generateToken<T>(
    payload: T extends object ? T : never,
    type: TokenType,
    dynamicSecretSuffix?: string,
  ): Promise<string> {
    const config = this.getTokenConfig(type);

    return this.jwtService.signAsync<typeof payload>(payload, {
      secret: dynamicSecretSuffix ? `${config.secret}${dynamicSecretSuffix}` : config.secret,
      expiresIn: config.expiresIn
    });
  }

  /**   
   * Generate email verification token
   */
  async generateEmailVerificationToken(userId: string, email: string): Promise<string> {

    const payload: IEmailVerificationPayload = {
      sub: userId,
      email: email,
      type: TokenType.EMAIL_VERIFICATION
    }

    return this.generateToken<IEmailVerificationPayload>(payload, TokenType.EMAIL_VERIFICATION)
  }

  /**
   * Generate password reset token with dynamic secret
   */
  async generatePasswordResetToken(userId: string, password: string): Promise<string> {
    const payload: IPasswordResetPayload = {
      sub: userId,
      type: TokenType.PASSWORD_RESET,
    }

    return this.generateToken<IPasswordResetPayload>(payload, TokenType.PASSWORD_RESET, password);
  }

  /**
   * Generate access token
   */
  async generateAccessToken(userId: string, email: string, role: Role): Promise<string> {
    const payload: IAccessPayload = {
      sub: userId,
      email: email,
      role: role,
      type: TokenType.ACCESS
    }

    return this.generateToken<IAccessPayload>(payload, TokenType.ACCESS);
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(userId: string, email: string, role: Role): Promise<string> {
    const payload: IRefreshPayload = {
      sub: userId,
      type: TokenType.REFRESH,
      email: email,
      role: role
    }
    return this.generateToken<IRefreshPayload>(payload, TokenType.REFRESH);
  }

  /**
   * Verify token based on type
   * @returns Decoded token payload
   */
  async verifyToken<T>(
    token: string,
    type: TokenType,
    dynamicSecretSuffix?: string,
  ): Promise<T> {
    try {
      const config = this.getTokenConfig(type);

      return this.jwtService.verifyAsync(token, {
        secret: dynamicSecretSuffix ? `${config.secret}${dynamicSecretSuffix}` : config.secret
      }) as T;
    } catch (err) {
      if (err instanceof JwtTokenExpiredError) {
        throw new TokenExpiredError('Token has expired');
      }
      if (err instanceof JsonWebTokenError) {
        throw new TokenInvalidError('Token is invalid');
      }

      throw err; // rethrow unexpected errors
    }
  }

  /**
   * Decode token without verification
   */
  decodeToken<T>(token: string): T | null {
    return this.jwtService.decode(token) as T | null;
  }

  /**
   * Get token configuration based on type
   */
  private getTokenConfig(type: TokenType): {
    secret: string;
    expiresIn: JwtSignOptions["expiresIn"];
  } {
    switch (type) {
      case TokenType.ACCESS:
        return {
          secret: this.configService.get('auth.accessTokenSecret', { infer: true })!,
          expiresIn: `${this.configService.get('auth.accessTokenExpirationMinutes', { infer: true })!}m`,
        };

      case TokenType.REFRESH:
        return {
          secret: this.configService.get('auth.refreshTokenSecret', { infer: true })!,
          expiresIn: `${this.configService.get('auth.refreshTokenExpirationDays', { infer: true })!}d`,
        };

      case TokenType.EMAIL_VERIFICATION:
        return {
          secret: this.configService.get<string>('auth.verificationTokenSecret', { infer: true })!,
          expiresIn: `${this.configService.get('auth.verificationTokenExpirationHours', { infer: true })!}h`,
        };

      case TokenType.PASSWORD_RESET:
        return {
          secret: this.configService.get<string>('auth.forgotPasswordTokenSecret', { infer: true })!,
          expiresIn: `${this.configService.get('auth.forgotPasswordTokenExpirationHours', { infer: true })!}h`,
        };

      default:
        throw new Error(`Unknown token type: ${type}`);
    }
  }
}