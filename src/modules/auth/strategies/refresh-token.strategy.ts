import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../types/jwt-payload.type";
import { JwtPayloadType } from "../enums/jwt-payload-type.enum";
import { IRequestUser } from "src/common/decorator/interfaces/request-user.interface";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET', { infer: true }),
      ignoreExpiration: false,
    })
  }

  override async validate(payload: JwtPayload) {
    if (payload.type !== JwtPayloadType.REFRESH) {
      throw new Error('Invalid token type. Refresh token required.');
    }

    const user: IRequestUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    }

    return user;
  }
}