import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AllConfigType } from "src/config/config.type";
import { Request } from "express";
import { RefreshTokenPayload } from "../generator/refresh-token.generator";
import { ValidateRefreshTokenUseCase } from "../../application/use-cases/validate-refresh-token.usecase";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly validateRefreshTokenUseCase: ValidateRefreshTokenUseCase,
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

    // Ambil refresh token dari berbagai sumber (cookie, body, header)
    const incomingRefreshToken: string = req.cookies?.refreshToken || req.body?.refreshToken || req.headers?.authorization?.replace('Bearer ', '');

    return await this.validateRefreshTokenUseCase.execute({
      tokenPayload: payload,
      refreshToken: incomingRefreshToken,
    });

  }
}