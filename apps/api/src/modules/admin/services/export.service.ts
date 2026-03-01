import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@prisma-db';
import { ExportTenantDto } from '../dto/export-tenant.dto';

export interface ExportJobData {
    tenantId: string;
    userId: string;
    format: 'json' | 'csv';
    include: string[];
}

export interface ExportJobStatus {
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    filePath?: string;
    error?: string;
}

@Injectable()
export class ExportService {
    private readonly logger = new Logger(ExportService.name);

    constructor(
        @InjectQueue('tenant-export') private readonly exportQueue: Queue,
        private readonly prisma: PrismaService,
    ) { }

    async requestExport(
        tenantId: string,
        userId: string,
        dto: ExportTenantDto,
    ): Promise<{ jobId: string; status: string }> {
        const job = await this.exportQueue.add('export', {
            tenantId,
            userId,
            format: dto.format,
            include: dto.include,
        } satisfies ExportJobData);

        this.logger.log(`Export job queued: ${job.id} for tenant ${tenantId}`);

        // 監査ログ
        await this.prisma.auditLog.create({
            data: {
                tenantId,
                userId,
                action: 'tenant.export',
                resourceType: 'tenant',
                resourceId: tenantId,
                metadata: {
                    jobId: job.id,
                    format: dto.format,
                    include: dto.include,
                },
            },
        });

        return { jobId: job.id!, status: 'queued' };
    }

    async getExportStatus(jobId: string): Promise<ExportJobStatus> {
        const job = await this.exportQueue.getJob(jobId);

        if (!job) {
            throw new NotFoundException({
                code: 'ERR-EXPORT-001',
                message: 'エクスポートジョブが見つかりません',
            });
        }

        const state = await job.getState();
        const progress = typeof job.progress === 'number' ? job.progress : 0;

        const statusMap: Record<string, ExportJobStatus['status']> = {
            waiting: 'queued',
            delayed: 'queued',
            active: 'processing',
            completed: 'completed',
            failed: 'failed',
        };

        return {
            jobId: job.id!,
            status: statusMap[state] ?? 'queued',
            progress,
            ...(state === 'completed' && job.returnvalue
                ? { filePath: job.returnvalue }
                : {}),
            ...(state === 'failed' && job.failedReason
                ? { error: job.failedReason }
                : {}),
        };
    }

    async getExportFile(jobId: string): Promise<string> {
        const job = await this.exportQueue.getJob(jobId);

        if (!job) {
            throw new NotFoundException({
                code: 'ERR-EXPORT-001',
                message: 'エクスポートジョブが見つかりません',
            });
        }

        const state = await job.getState();

        if (state !== 'completed' || !job.returnvalue) {
            throw new NotFoundException({
                code: 'ERR-EXPORT-002',
                message: 'エクスポートファイルはまだ準備できていません',
            });
        }

        return job.returnvalue;
    }
}
