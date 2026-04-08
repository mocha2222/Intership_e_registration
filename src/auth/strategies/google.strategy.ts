import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);
  constructor(config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      Logger.warn(
        'Google OAuth keys are not set. Google authentication will be unavailable.',
        'GoogleStrategy',
      );
    }

    super({
      clientID: clientID ?? '',
      clientSecret: clientSecret ?? '',
      callbackURL: callbackURL ?? '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value ?? null;
    const avatarUrl = profile.photos?.[0]?.value ?? null;

    done(null, {
      googleId: profile.id,
      email,
      name: profile.displayName ?? 'Google User',
      avatarUrl,
    });
  }
}
