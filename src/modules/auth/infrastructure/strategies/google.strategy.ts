import { BadRequestException, Injectable } from "@nestjs/common";
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
      scope: ['email', 'profile'],
    })
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): void {
    const { name, emails, photos, id, provider, displayName } = profile;

    const email = emails?.[0].value
    const firstName = name?.givenName || displayName.split(' ')[0];
    const lastName = name?.familyName || displayName.split(' ').slice(1).join(' ');

    if (!email) {
      return done(new BadRequestException('No email associated with this account!'), undefined);
    }

    const user = {
      email: email,
      firstName: firstName.length > 0 ? firstName : null,
      lastName: lastName.length > 0 ? lastName : null,
      picture: photos && photos.length > 0 ? photos[0].value : null,
      providerId: id,
      provider: provider
    }

    done(null, user);
  }
}