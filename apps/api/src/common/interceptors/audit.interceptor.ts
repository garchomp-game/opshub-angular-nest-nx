import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '@prisma-db';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    private readonly logger = new Logger(AuditInterceptor.name);

    constructor(private readonly prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, user } = request;

        // GET は記録しない
        if (method === 'GET') return next.handle();

        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: async (responseData) => {
                    try {
                        await this.prisma.auditLog.create({
                            data: {
                                tenantId: user.tenantId,
                                userId: user.id,
                                action: this.resolveAction(method, url),
                                resourceType: this.extractResourceType(url),
                                resourceId: responseData?.id ?? responseData?.data?.id ?? null,
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
                                metadata: { url, method, error: error.message },
                            },
                        });
                    } catch {
                        // 監査ログ自体の失敗はサイレントに
                    }
                },
            }),
        );
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
