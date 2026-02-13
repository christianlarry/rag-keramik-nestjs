import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";
import { AllConfigType } from "src/config/config.type";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly config: ConfigService<AllConfigType>
  ) {
    super({
      clientID: config.get<string>('authGoogle.clientID', { infer: true })!,
      clientSecret: config.get<string>('authGoogle.clientSecret', { infer: true })!,
      callbackURL: config.get<string>('authGoogle.callbackURL', { infer: true })!,
    })
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): void {
    const { name, emails, photos, id, provider } = profile;

    const user = {
      email: emails && emails.length > 0 ? emails[0].value : null,
      firstName: name?.givenName + ' ' + name?.middleName || null,
      lastName: name?.familyName || null,
      picture: photos && photos.length > 0 ? photos[0].value : null,
      providerId: id,
      provider: provider
    }

    done(null, user);
  }
}