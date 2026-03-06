import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

/**
 * メモリ使用量ヘルスチェック
 * RSS が閾値（デフォルト 512MB）を超えた場合に unhealthy を返す
 */
@Injectable()
export class MemoryHealthIndicator extends HealthIndicator {
    private readonly thresholdBytes: number;

    constructor() {
        super();
        this.thresholdBytes = parseInt(
            process.env['HEALTH_MEMORY_THRESHOLD_MB'] || '512',
            10,
        ) * 1_048_576;
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        const { rss, heapUsed, heapTotal } = process.memoryUsage();
        const isHealthy = rss < this.thresholdBytes;

        const result = this.getStatus(key, isHealthy, {
            rss: `${Math.round(rss / 1_048_576)}MB`,
            heapUsed: `${Math.round(heapUsed / 1_048_576)}MB`,
            heapTotal: `${Math.round(heapTotal / 1_048_576)}MB`,
            threshold: `${Math.round(this.thresholdBytes / 1_048_576)}MB`,
        });

        if (!isHealthy) {
            throw new HealthCheckError('Memory usage too high', result);
        }

        return result;
    }
}
