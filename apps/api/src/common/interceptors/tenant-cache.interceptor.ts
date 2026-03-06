import { Injectable, ExecutionContext } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

/**
 * テナントIDをキャッシュキーに含めるカスタムキャッシュインターセプター
 *
 * デフォルトの CacheInterceptor は URL のみでキャッシュキーを生成するが、
 * マルチテナント環境ではテナントごとにキャッシュを分離する必要がある。
 */
@Injectable()
export class TenantCacheInterceptor extends CacheInterceptor {
    protected trackBy(context: ExecutionContext): string | undefined {
        const request = context.switchToHttp().getRequest();
        const tenantId =
            request.headers?.['x-tenant-id'] ??
            request.user?.tenantIds?.[0] ??
            request.user?.tenantId ??
            'unknown';

        const url = request.url || request.raw?.url || '';
        return `tenant:${tenantId}:${url}`;
    }
}
