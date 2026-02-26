import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser as ICurrentUser } from '@shared/types';

export const CurrentUser = createParamDecorator(
    (data: keyof ICurrentUser | 'tenantId' | undefined, ctx: ExecutionContext): ICurrentUser | any => {
        const user = ctx.switchToHttp().getRequest().user as ICurrentUser;
        if (!user) return user;

        // tenantId ショートカット: tenantIds[0] を tenantId として公開
        const enriched = {
            ...user,
            tenantId: (user as any).tenantId ?? user.tenantIds?.[0],
        };

        return data ? (enriched as any)[data] : enriched;
    },
);
