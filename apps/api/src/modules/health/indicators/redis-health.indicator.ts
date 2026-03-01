import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckError, HealthIndicatorResult } from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RedisHealthIndicator {
    private readonly logger = new Logger(RedisHealthIndicator.name);

    constructor(@InjectQueue('mail') private readonly mailQueue: Queue) { }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            // BullMQ の Queue から内部の ioredis client を取得して ping
            const client = await this.mailQueue.client;
            const result = await client.ping();
            if (result !== 'PONG') {
                throw new Error(`Unexpected ping response: ${result}`);
            }
            return { [key]: { status: 'up' } };
        } catch (error) {
            this.logger.warn(
                `Redis health check failed: ${error instanceof Error ? error.message : error}`,
            );
            throw new HealthCheckError(
                'Redis check failed',
                { [key]: { status: 'down' } },
            );
        }
    }
}
