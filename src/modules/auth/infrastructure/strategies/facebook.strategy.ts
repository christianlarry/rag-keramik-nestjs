import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { AllConfigType } from "src/config/config.type";
import { Profile, Strategy } from "passport-facebook";

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly config: ConfigService<AllConfigType>
  ) {
    super({
      clientID: config.get<string>('authFacebook.clientID', { infer: true })!,
      clientSecret: config.get<string>('authFacebook.clientSecret', { infer: true })!,
      callbackURL: config.get<string>('authFacebook.callbackURL', { infer: true })!,
    })
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any, info?: any) => void
  ): void {
    const { name, emails, id, provider, photos } = profile;

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