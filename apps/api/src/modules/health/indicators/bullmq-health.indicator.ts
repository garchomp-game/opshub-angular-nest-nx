import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * BullMQ キューのヘルスチェック
 * 失敗ジョブ数が閾値を超えた場合に unhealthy を返す
 */
@Injectable()
export class BullMQHealthIndicator extends HealthIndicator {
    constructor(@InjectQueue('mail') private readonly mailQueue: Queue) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            const [waiting, active, failed] = await Promise.all([
                this.mailQueue.getWaitingCount(),
                this.mailQueue.getActiveCount(),
                this.mailQueue.getFailedCount(),
            ]);

            const isHealthy = failed < 100; // 100件以上の失敗は異常
            const result = this.getStatus(key, isHealthy, {
                waiting,
                active,
                failed,
            });

            if (!isHealthy) {
                throw new HealthCheckError('BullMQ unhealthy', result);
            }

            return result;
        } catch (error) {
            if (error instanceof HealthCheckError) throw error;
            throw new HealthCheckError('BullMQ check failed', this.getStatus(key, false));
        }
    }
}
