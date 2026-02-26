import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tenantStore } from '@prisma-db';
import { SKIP_TENANT_KEY } from '../decorators/skip-tenant-check.decorator';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const tenantId = request.headers['x-tenant-id'] ?? user?.tenantId;

        return new Observable((subscriber) => {
            tenantStore.run(
                { tenantId, skipTenantCheck: skipTenant ?? false },
                () => next.handle().subscribe(subscriber),
            );
        });
    }
}
