import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser as ICurrentUser } from '@shared/types';

export const CurrentUser = createParamDecorator(
    (data: keyof ICurrentUser | undefined, ctx: ExecutionContext): ICurrentUser | any => {
        const user = ctx.switchToHttp().getRequest().user as ICurrentUser;
        return data ? user[data] : user;
    },
);
