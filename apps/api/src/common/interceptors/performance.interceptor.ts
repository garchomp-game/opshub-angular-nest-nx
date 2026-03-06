import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/**
 * リクエスト処理時間をログに記録するインターセプター
 *
 * 全リクエストの処理時間を pino ログに出力する。
 * 閾値（デフォルト 1000ms）を超えた場合は warn レベルで出力。
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
    private readonly logger = new Logger('Performance');
    private readonly slowThresholdMs: number;

    constructor() {
        this.slowThresholdMs = parseInt(
            process.env['PERF_SLOW_THRESHOLD_MS'] || '1000',
            10,
        );
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const url = request.url || request.raw?.url;
        const start = performance.now();

        return next.handle().pipe(
            tap(() => {
                const durationMs = Math.round(performance.now() - start);

                if (durationMs >= this.slowThresholdMs) {
                    this.logger.warn({
                        method,
                        url,
                        durationMs,
                        threshold: this.slowThresholdMs,
                    }, `🐌 Slow request: ${method} ${url} (${durationMs}ms)`);
                } else {
                    this.logger.debug({
                        method,
                        url,
                        durationMs,
                    }, `${method} ${url} (${durationMs}ms)`);
                }
            }),
        );
    }
}
