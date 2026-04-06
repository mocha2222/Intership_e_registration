import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { ExecutionContext } from '@nestjs/common';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  override getAuthenticateOptions(_context: ExecutionContext) {
    return {
      scope: ['email', 'profile'],
      session: false,
    };
  }
}
