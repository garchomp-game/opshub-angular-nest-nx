import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { statfs } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * ディスク使用量ヘルスチェック
 * uploads ディレクトリのディスク空き容量が閾値（デフォルト 1GB）を下回った場合に unhealthy
 */
@Injectable()
export class DiskHealthIndicator extends HealthIndicator {
    private readonly thresholdBytes: number;
    private readonly checkPath: string;

    constructor() {
        super();
        this.thresholdBytes = parseInt(
            process.env['HEALTH_DISK_THRESHOLD_GB'] || '1',
            10,
        ) * 1_073_741_824;
        this.checkPath = resolve(process.cwd(), 'uploads');
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            const stats = await statfs(this.checkPath);
            const freeBytes = stats.bavail * stats.bsize;
            const totalBytes = stats.blocks * stats.bsize;
            const isHealthy = freeBytes > this.thresholdBytes;

            const result = this.getStatus(key, isHealthy, {
                free: `${Math.round(freeBytes / 1_073_741_824)}GB`,
                total: `${Math.round(totalBytes / 1_073_741_824)}GB`,
                threshold: `${Math.round(this.thresholdBytes / 1_073_741_824)}GB`,
                path: this.checkPath,
            });

            if (!isHealthy) {
                throw new HealthCheckError('Disk space low', result);
            }

            return result;
        } catch (error) {
            if (error instanceof HealthCheckError) throw error;
            // If uploads directory doesn't exist, still healthy (nothing stored yet)
            return this.getStatus(key, true, { note: 'uploads directory not found' });
        }
    }
}
