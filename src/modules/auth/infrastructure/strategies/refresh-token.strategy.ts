import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AllConfigType } from "src/config/config.type";
import { Request } from "express";
import { UsersService } from "src/modules/users/users.service";
import { RefreshTokenGenerator, RefreshTokenPayload } from "../generator/refresh-token.generator";
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { Status } from "src/modules/users/domain/enums/status.enum";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly usersService: UsersService,
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
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

  override async validate(req: Request, payload: RefreshTokenPayload): Promise<Record<string, any>> {
    if (payload.type !== RefreshTokenGenerator.TokenType) {
      throw new UnauthorizedException('Invalid token type');
    }

    const incomingRefreshToken: string = req.cookies?.refreshToken || req.body?.refreshToken || req.headers?.authorization?.replace('Bearer ', '');

    if (!incomingRefreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const authUser = await this.authUserRepository.findById(payload.sub);
    if (!authUser) {
      throw new UnauthorizedException('User not found.');
    }

    // Cek apakah user masih aktif
    this.validateUserStatus(authUser.status.getValue());

    // Cek apakah ada refresh token di database
    if (authUser.hasNoRefreshTokens()) {
      throw new UnauthorizedException('No active sessions found. Please log in again.');
    }

    // Cek apakah refresh token valid, Jika tidak, hapus semua refresh token (logout dari semua device) Possible token theft
    if (!authUser.hasRefreshToken(incomingRefreshToken)) {
      authUser.clearRefreshTokens();
      await this.authUserRepository.save(authUser);

      throw new UnauthorizedException('Refresh token is invalid or has been revoked');
    }

    return {
      id: authUser.id.getValue(),
      email: authUser.email.getValue(),
      role: authUser.role.getValue(),
      refreshToken: incomingRefreshToken,
    }
  }

  /**
   * Validate user account status
   * @throws UnauthorizedException if status is not ACTIVE
   */
  private validateUserStatus(status: Status): void {
    switch (status) {
      case Status.ACTIVE:
        return; // Valid status

      case Status.INACTIVE:
        throw new UnauthorizedException(
          'User account is inactive. Please verify your email.'
        );

      case Status.SUSPENDED:
        throw new UnauthorizedException(
          'User account is suspended. Contact support for more information.'
        );

      case Status.DELETED:
        throw new UnauthorizedException(
          'User account has been deleted.'
        );

      case undefined:
      default:
        throw new UnauthorizedException('Invalid user status');
    }
  }
}