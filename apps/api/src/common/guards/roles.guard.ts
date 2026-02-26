import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CurrentUser } from '@shared/types';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // @Roles() が未指定 → 全ロール許可
        if (!requiredRoles || requiredRoles.length === 0) return true;

        const user = context.switchToHttp().getRequest().user as CurrentUser;
        if (!user) throw new ForbiddenException('ユーザー情報が取得できません');

        const activeTenantId = user.tenantIds?.[0] ?? (user as any).tenantId;
        const userRoles = user.roles
            .filter((r) => r.tenantId === activeTenantId)
            .map((r) => r.role);

        const hasRole = requiredRoles.some((role) => userRoles.includes(role as any));
        if (!hasRole) {
            throw new ForbiddenException(
                `この操作には ${requiredRoles.join(' / ')} ロールが必要です`,
            );
        }
        return true;
    }
}
