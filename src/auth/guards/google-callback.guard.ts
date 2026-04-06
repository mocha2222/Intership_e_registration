import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { ExecutionContext } from '@nestjs/common';

@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
  override getAuthenticateOptions(_context: ExecutionContext) {
    return {
      session: false,
    };
  }
}
