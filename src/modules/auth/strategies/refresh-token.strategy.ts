import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../types/jwt-payload.type";
import { JwtTokenType } from "../enums/jwt-payload-type.enum";
import { IRequestUser } from "src/common/decorator/interfaces/request-user.interface";
import { AllConfigType } from "src/config/config.type";
import { Request } from "express";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(private readonly configService: ConfigService<AllConfigType>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token: string = req?.cookies?.refreshToken;

          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.getOrThrow<string>('auth.refreshTokenSecret', { infer: true }),
      ignoreExpiration: false,
      passReqToCallback: true,
    })
  }

  override async validate(req: Request, payload: JwtPayload) {
    if (payload.type !== JwtTokenType.REFRESH) {
      throw new UnauthorizedException('Invalid token type');
    }

    const refreshToken: string = req.cookies?.refreshToken || req.headers?.authorization?.replace('Bearer ', '');

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const user: IRequestUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken: refreshToken,
    }

    return user;
  }
}