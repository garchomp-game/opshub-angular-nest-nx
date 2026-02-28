import {
    ArgumentsHost, Catch, ExceptionFilter,
    HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Response } from 'express';

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
