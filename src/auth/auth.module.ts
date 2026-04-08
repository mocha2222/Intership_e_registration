import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleCallbackGuard } from './guards/google-callback.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(
            config.get<number>('JWT_EXPIRES_IN') ?? 60 * 60 * 24 * 7,
          ),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    // Register GoogleStrategy only when Google env vars exist to avoid startup errors
    {
      provide: GoogleStrategy,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const clientID = config.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
        const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL');
        if (!clientID || !clientSecret || !callbackURL) {
          return undefined;
        }
        return new GoogleStrategy(config);
      },
    },
    GoogleAuthGuard,
    GoogleCallbackGuard,
  ],
  controllers: [AuthController],
})
export class AuthModule { }
