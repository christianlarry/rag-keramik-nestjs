import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AllConfigType } from "src/config/config.type";

interface RefreshTokenPayload {
  sub: string;
  type: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

interface GenerateRefreshTokenParams {
  userId: string;
}

@Injectable()
export class RefreshTokenGenerator {

  private readonly secret: string;
  private readonly expirationTimeInSeconds: number;

  static readonly TokenType = 'REFRESH_TOKEN';

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>
  ) {
    this.secret = this.configService.get<string>('auth.refreshTokenSecret', { infer: true })!;
    this.expirationTimeInSeconds = (this.configService.get<number>('auth.refreshTokenExpirationDays', { infer: true })!) * 24 * 60 * 60;
  }

  async generate(params: GenerateRefreshTokenParams): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: params.userId,
      type: RefreshTokenGenerator.TokenType,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.secret,
      expiresIn: this.expirationTimeInSeconds
    });
  }

  async verify(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token);
  }

  async decode(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.decode<RefreshTokenPayload>(token);
  }
}