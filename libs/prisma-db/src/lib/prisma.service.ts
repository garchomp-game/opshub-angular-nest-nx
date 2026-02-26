import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { applyTenantFilter } from './middleware/tenant.middleware';
import { enforceAuditLogAppendOnly } from './middleware/audit-log.middleware';

/**
 * Prisma v6 $extends で Middleware 相当のロジックを登録した拡張クライアントを作成。
 * テナント分離 + 監査ログ append-only 保護を自動適用する。
 */
function createExtendedPrismaClient() {
    const base = new PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
        ],
    });

    return base.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    // 1. AuditLog の append-only 保護
                    enforceAuditLogAppendOnly(model, operation);

                    // 2. テナントフィルタ適用
                    const filteredArgs = applyTenantFilter(model, operation, args);

                    return query(filteredArgs);
                },
            },
        },
    });
}

/** $extends 戻り値の型（外部利用可能） */
export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;

/**
 * PrismaService — NestJS の標準パターンに沿った DI 可能な Prisma クライアント。
 *
 * 使い方: `this.prisma.user.findMany()` (`.db` アクセサ不要)
 *
 * 内部的に $extends で TenantMiddleware + AuditLogMiddleware を統合しており、
 * Service からは通常の PrismaClient と同様に利用可能。
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private readonly _client: ExtendedPrismaClient;

    constructor() {
        this._client = createExtendedPrismaClient();

        // Proxy で _client のすべてのプロパティを this に委譲
        return new Proxy(this, {
            get(target, prop, receiver) {
                // PrismaService 自身のプロパティ/メソッドを優先
                if (prop in target || typeof prop === 'symbol') {
                    return Reflect.get(target, prop, receiver);
                }
                // それ以外は拡張済み PrismaClient に委譲 (user, project 等)
                return (target._client as any)[prop];
            },
        });
    }

    async onModuleInit(): Promise<void> {
        await this._client.$connect();
        this.logger.log('Prisma connected to database');

        // クエリログ（開発環境のみ）
        if (process.env['NODE_ENV'] === 'development') {
            (this._client as any).$on('query', (e: any) => {
                this.logger.debug(
                    `Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`,
                );
            });
        }
    }

    async onModuleDestroy(): Promise<void> {
        await this._client.$disconnect();
        this.logger.log('Prisma disconnected from database');
    }

    /** ヘルスチェック用の接続確認 */
    async healthCheck(): Promise<boolean> {
        try {
            await this._client.$queryRaw`SELECT 1`;
            return true;
        } catch {
            return false;
        }
    }

    /** $transaction を直接公開 */
    get $transaction() {
        return this._client.$transaction.bind(this._client);
    }

    /** $queryRaw を直接公開 */
    get $queryRaw() {
        return this._client.$queryRaw.bind(this._client);
    }
}

/**
 * 型アサーション用インターフェース。
 * Service で `private prisma: PrismaService` と inject すると
 * `this.prisma.user.findMany()` のように型補完が効く。
 */
export interface PrismaService extends ExtendedPrismaClient { }
