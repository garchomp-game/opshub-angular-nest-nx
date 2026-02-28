import {
    ArgumentsHost, Catch, ExceptionFilter,
    HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Response } from 'express';

/** PII マスキング対象フィールド名 */
const SENSITIVE_FIELDS = ['password', 'token', 'secret'];
const EMAIL_REGEX = /^(.)[^@]*(@.+)$/;

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code = 'ERR-SYS-001';
        let fields: Record<string, string> | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exResponse = exception.getResponse();

            if (typeof exResponse === 'object' && exResponse !== null) {
                const r = exResponse as any;
                message = r.message ?? exception.message;
                code = r.code ?? this.statusToCode(status);

                // ValidationPipe のエラー配列をフィールドマップに変換
                if (Array.isArray(r.message)) {
                    fields = {};
                    r.message.forEach((msg: string) => {
                        const [field, ...rest] = msg.split(' ');
                        fields![field] = rest.join(' ');
                    });
                    message = 'バリデーションエラー';
                }
            } else {
                message = String(exResponse);
            }
        }

        // ログ出力: 5xx → error、4xx → warn
        const logContext = {
            status,
            code,
            message,
            method: request?.method,
            url: request?.url,
            userId: request?.user?.id,
            body: this.maskPii(request?.body),
        };

        if (status >= 500) {
            this.logger.error(logContext, 'Server error');
            if (exception instanceof Error) {
                this.logger.error({ stack: exception.stack }, 'Stack trace');
            }
        } else if (status >= 400) {
            this.logger.warn(logContext, 'Client error');
        }

        response.status(status).json({
            success: false,
            error: { code, message, fields },
        });
    }

    /**
     * リクエスト body 内の PII をマスクする。
     * - password, token, secret → '***'
     * - メールアドレス → 部分マスク (e.g., 'a***@demo.com')
     */
    private maskPii(body: unknown): unknown {
        if (!body || typeof body !== 'object') return body;
        if (Array.isArray(body)) return body.map((item) => this.maskPii(item));

        const masked: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
            if (SENSITIVE_FIELDS.includes(key.toLowerCase()) && value) {
                masked[key] = '***';
            } else if (typeof value === 'string' && EMAIL_REGEX.test(value)) {
                masked[key] = this.maskEmail(value);
            } else if (typeof value === 'object' && value !== null) {
                masked[key] = this.maskPii(value);
            } else {
                masked[key] = value;
            }
        }
        return masked;
    }

    /**
     * メールアドレスを部分マスクする。
     * 例: 'admin@demo.com' → 'a***@demo.com'
     */
    private maskEmail(email: string): string {
        const match = email.match(EMAIL_REGEX);
        if (!match) return email;
        return `${match[1]}***${match[2]}`;
    }

    private statusToCode(status: number): string {
        const map: Record<number, string> = {
            400: 'ERR-VAL-000',
            401: 'ERR-AUTH-001',
            403: 'ERR-AUTH-002',
            404: 'ERR-SYS-002',
            409: 'ERR-SYS-003',
        };
        return map[status] ?? 'ERR-SYS-001';
    }
}
