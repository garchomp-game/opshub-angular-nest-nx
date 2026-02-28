import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable, tap, from, switchMap } from 'rxjs';
import { PrismaService } from '@prisma-db';

/**
 * 監査ログインターセプター
 *
 * 非 GET リクエストの操作を audit_logs テーブルに記録する。
 * - PATCH / PUT / DELETE の場合、操作前のデータ (beforeData) も取得して記録する。
 * - 操作後のリクエストボディを afterData として記録する。
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
    private readonly logger = new Logger(AuditInterceptor.name);

    /**
     * リソースタイプ → Prisma モデル名のマッピング。
     * beforeData 取得時に使用する。
     */
    private readonly modelMap: Record<string, string> = {
        workflows: 'workflow',
        expenses: 'expense',
        projects: 'project',
        tasks: 'task',
        timesheets: 'timesheet',
        invoices: 'invoice',
        notifications: 'notification',
    };

    constructor(private readonly prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, user, params } = request;

        // GET は記録しない
        if (method === 'GET') return next.handle();

        // 未認証（@Public() エンドポイント: login, register, refresh）はスキップ
        if (!user?.id || !user?.tenantId) return next.handle();

        const startTime = Date.now();
        const isModifyOp = ['PATCH', 'PUT', 'DELETE'].includes(method);
        const resourceId = params?.id;

        // beforeData 取得（変更/削除操作でリソース ID がある場合のみ）
        const beforeData$ = isModifyOp && resourceId
            ? from(this.fetchBeforeData(url, resourceId))
            : from(Promise.resolve(undefined));

        return beforeData$.pipe(
            switchMap((beforeData) =>
                next.handle().pipe(
                    tap({
                        next: async (responseData) => {
                            try {
                                await this.prisma.auditLog.create({
                                    data: {
                                        tenantId: user.tenantId,
                                        userId: user.id,
                                        action: this.resolveAction(method, url),
                                        resourceType: this.extractResourceType(url),
                                        resourceId: resourceId ?? responseData?.id ?? responseData?.data?.id ?? null,
                                        beforeData: beforeData ?? undefined,
                                        afterData: body,
                                        metadata: {
                                            url,
                                            method,
                                            duration: Date.now() - startTime,
                                            userAgent: request.headers['user-agent'],
                                            ip: request.ip,
                                        },
                                    },
                                });
                            } catch (error) {
                                this.logger.error('Failed to create audit log', error);
                            }
                        },
                        error: async (error) => {
                            try {
                                await this.prisma.auditLog.create({
                                    data: {
                                        tenantId: user?.tenantId,
                                        userId: user?.id,
                                        action: `${this.resolveAction(method, url)}.failed`,
                                        resourceType: this.extractResourceType(url),
                                        beforeData: beforeData ?? undefined,
                                        metadata: { url, method, error: error.message },
                                    },
                                });
                            } catch {
                                // 監査ログ自体の失敗はサイレントに
                            }
                        },
                    }),
                ),
            ),
        );
    }

    /**
     * リソース ID から変更前のデータを取得する。
     * Prisma の動的モデルアクセスを使用。
     */
    private async fetchBeforeData(url: string, resourceId: string): Promise<Record<string, any> | undefined> {
        try {
            const resourceType = this.extractResourceType(url);
            const modelName = this.modelMap[resourceType];

            if (!modelName) return undefined;

            const model = (this.prisma as any)[modelName];
            if (!model?.findUnique) return undefined;

            const record = await model.findUnique({ where: { id: resourceId } });
            return record ?? undefined;
        } catch (error) {
            // beforeData の取得失敗は監査ログの記録自体を妨げないが、ログには記録する
            this.logger.warn('Failed to fetch beforeData', { url, resourceId, error: (error as Error)?.message });
            return undefined;
        }
    }

    private resolveAction(method: string, url: string): string {
        const resource = this.extractResourceType(url);
        const methodMap: Record<string, string> = {
            POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete',
        };
        const suffix = url.includes('/approve') ? 'approve'
            : url.includes('/reject') ? 'reject'
                : url.includes('/withdraw') ? 'withdraw'
                    : url.includes('/submit') ? 'submit'
                        : url.includes('/status') ? 'status_change'
                            : url.includes('/invite') ? 'invite'
                                : url.includes('/role') ? 'role_change'
                                    : methodMap[method] ?? method.toLowerCase();
        return `${resource}.${suffix}`;
    }

    private extractResourceType(url: string): string {
        const segments = url.replace(/^\/api\//, '').split('/');
        return segments[0] ?? 'unknown';
    }
}
