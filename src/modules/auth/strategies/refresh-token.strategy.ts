import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { IRequestUser } from "src/common/decorator/interfaces/request-user.interface";
import { AllConfigType } from "src/config/config.type";
import { Request } from "express";
import { UsersService } from "src/modules/users/application/users.service";
import { IRefreshPayload } from "src/infrastructure/token/interfaces/refresh-payload.interface";
import { TokenType } from "src/infrastructure/token/enums/token-type.enum";
import { UserStatus } from "src/modules/users/domain/entities/user.entity";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token: string = req?.cookies?.refreshToken;

          return token;
        },
        ExtractJwt.fromBodyField('refreshToken'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.getOrThrow<string>('auth.refreshTokenSecret', { infer: true }),
      ignoreExpiration: false,
      passReqToCallback: true,
    })
  }

  override async validate(req: Request, payload: IRefreshPayload) {
    if (payload.type !== TokenType.REFRESH) {
      throw new UnauthorizedException('Invalid token type');
    }

    const incomingRefreshToken: string = req.cookies?.refreshToken || req.body?.refreshToken || req.headers?.authorization?.replace('Bearer ', '');

    if (!incomingRefreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // Cek apakah user masih aktif
    this.validateUserStatus(user.status);

    // Cek apakah ada refresh token di database
    if (!user.refreshTokens || user.refreshTokens.length === 0) {
      throw new UnauthorizedException('No active sessions found. Please log in again.');
    }

    // Cek apakah refresh token valid, Jika tidak, hapus semua refresh token (logout dari semua device) Possible token theft
    if (!user.refreshTokens.includes(incomingRefreshToken)) {
      await this.usersService.clearRefreshTokens(payload.sub);

      throw new UnauthorizedException('Refresh token is invalid or has been revoked');
    }

    const requestUser: IRequestUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken: incomingRefreshToken,
    }

    return requestUser;
  }

  /**
   * Validate user account status
   * @throws UnauthorizedException if status is not ACTIVE
   */
  private validateUserStatus(status: UserStatus | undefined): void {
    switch (status) {
      case UserStatus.ACTIVE:
        return; // Valid status

      case UserStatus.INACTIVE:
        throw new UnauthorizedException(
          'User account is inactive. Please verify your email.'
        );

      case UserStatus.SUSPENDED:
        throw new UnauthorizedException(
          'User account is suspended. Contact support for more information.'
        );

      case UserStatus.DELETED:
        throw new UnauthorizedException(
          'User account has been deleted.'
        );

      case undefined:
      default:
        throw new UnauthorizedException('Invalid user status');
    }
  }
}