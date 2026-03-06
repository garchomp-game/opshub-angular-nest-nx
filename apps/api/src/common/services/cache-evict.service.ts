import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * キャッシュ無効化サービス
 *
 * データ更新時にテナント単位でキャッシュを削除するために使用する。
 */
@Injectable()
export class CacheEvictService {
    constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) { }

    /**
     * 指定されたプレフィックスに一致するキャッシュキーを全て削除する
     *
     * @param tenantId テナントID
     * @param prefix キャッシュキープレフィックス (e.g., '/api/dashboard')
     */
    async evictByPrefix(tenantId: string, prefix: string): Promise<void> {
        // cache-manager v5+ の store に keys() がある場合はプレフィックスマッチで削除
        const store = (this.cache as any).store ?? (this.cache as any).stores?.[0];
        if (typeof store.keys === 'function') {
            const pattern = `tenant:${tenantId}:${prefix}*`;
            const keys: string[] = await store.keys(pattern);
            if (keys.length > 0) {
                await Promise.all(keys.map((key) => this.cache.del(key)));
            }
        }
    }

    /**
     * 特定のキーを直接削除する
     */
    async evict(key: string): Promise<void> {
        await this.cache.del(key);
    }

    /**
     * テナント内の全キャッシュを削除する
     */
    async evictTenant(tenantId: string): Promise<void> {
        await this.evictByPrefix(tenantId, '');
    }
}
