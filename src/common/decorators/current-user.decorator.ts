import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUser = { userId: number; email: string };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
