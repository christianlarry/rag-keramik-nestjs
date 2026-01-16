import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { AllConfigType } from "src/config/config.type";
import { TokenType } from "./enums/token-type.enum";

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>
  ) { }

  /**
   * Generate token based on type
   */
  async generateToken<T>(
    payload: T extends object ? T : never,
    type: TokenType,
  ): Promise<string> {
    const config = this.getTokenConfig(type);

    return this.jwtService.signAsync<typeof payload>(payload, {
      secret: config.secret,
      expiresIn: config.expiresIn
    });
  }

  /**
   * Verify token based on type
   */
  async verifyToken(
    token: string,
    type: TokenType,
  ): Promise<any> {
    const config = this.getTokenConfig(type);

    return this.jwtService.verifyAsync(token, {
      secret: config.secret,
    });
  }

  /**
   * Decode token without verification
   */
  decodeToken(token: string): any {
    return this.jwtService.decode(token);
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
          expiresIn: `${(this.configService.get('auth.accessTokenExpirationMinutes', { infer: true }) || 15)}m`,
        };

      case TokenType.REFRESH:
        return {
          secret: this.configService.get('auth.refreshTokenSecret', { infer: true })!,
          expiresIn: `${this.configService.get('auth.refreshTokenExpirationDays', { infer: true }) || 30}d`,
        };

      case TokenType.EMAIL_VERIFICATION:
        return {
          secret: this.configService.get<string>('auth.verificationTokenSecret', { infer: true })!,
          expiresIn: `${this.configService.get('auth.verificationTokenExpirationHours', { infer: true }) || 24}h`,
        };

      case TokenType.PASSWORD_RESET:
        return {
          secret: this.configService.get<string>('auth.forgotPasswordTokenSecret', { infer: true })!,
          expiresIn: `${this.configService.get('auth.forgotPasswordTokenExpirationHours', { infer: true }) || 1}h`,
        };

      default:
        throw new Error(`Unknown token type: ${type}`);
    }
  }
}