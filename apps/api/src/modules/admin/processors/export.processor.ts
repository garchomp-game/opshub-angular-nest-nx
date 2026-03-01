import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as archiver from 'archiver';
import { ExportJobData } from '../services/export.service';

@Processor('tenant-export')
export class ExportProcessor extends WorkerHost {
    private readonly logger = new Logger(ExportProcessor.name);

    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async process(job: Job<ExportJobData>): Promise<string> {
        const { tenantId, format, include } = job.data;
        const exportDir = path.resolve('exports', tenantId);

        fs.mkdirSync(exportDir, { recursive: true });
        this.logger.log(`Processing export job ${job.id} for tenant ${tenantId}`);

        // 各テーブルのデータを取得
        const data: Record<string, any[]> = {};
        for (let i = 0; i < include.length; i++) {
            const table = include[i];
            data[table] = await this.fetchTableData(tenantId, table);
            await job.updateProgress(Math.round(((i + 1) / include.length) * 100));
            this.logger.log(`Fetched ${data[table].length} records from ${table}`);
        }

        // ファイル生成
        if (format === 'json') {
            return this.generateJson(exportDir, job.id!, data);
        } else {
            return this.generateCsvZip(exportDir, job.id!, data);
        }
    }

    private generateJson(
        exportDir: string,
        jobId: string,
        data: Record<string, any[]>,
    ): string {
        const filePath = path.join(exportDir, `export-${jobId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        this.logger.log(`JSON export written: ${filePath}`);
        return filePath;
    }

    private async generateCsvZip(
        exportDir: string,
        jobId: string,
        data: Record<string, any[]>,
    ): Promise<string> {
        const zipPath = path.join(exportDir, `export-${jobId}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver.create('zip', { zlib: { level: 9 } });

        return new Promise<string>((resolve, reject) => {
            output.on('close', () => {
                this.logger.log(`CSV ZIP export written: ${zipPath} (${archive.pointer()} bytes)`);
                resolve(zipPath);
            });

            archive.on('error', (err: Error) => reject(err));
            archive.pipe(output);

            for (const [table, rows] of Object.entries(data)) {
                if (rows.length === 0) continue;
                const csv = this.toCsv(rows);
                archive.append(csv, { name: `${table}.csv` });
            }

            archive.finalize();
        });
    }

    private toCsv(rows: any[]): string {
        if (rows.length === 0) return '';

        const headers = Object.keys(rows[0]);
        const lines = [
            headers.join(','),
            ...rows.map((row) =>
                headers
                    .map((h) => {
                        const val = row[h];
                        if (val === null || val === undefined) return '';
                        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
                        // CSV エスケープ: ダブルクォート・カンマ・改行を含む場合はクォート
                        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                            return `"${str.replace(/"/g, '""')}"`;
                        }
                        return str;
                    })
                    .join(','),
            ),
        ];

        return lines.join('\n');
    }

    private async fetchTableData(tenantId: string, table: string): Promise<any[]> {
        switch (table) {
            case 'users':
                return this.prisma.userRole.findMany({
                    where: { tenantId },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                createdAt: true,
                                profile: {
                                    select: { displayName: true, avatarUrl: true },
                                },
                            },
                        },
                    },
                });
            case 'projects':
                return this.prisma.project.findMany({ where: { tenantId } });
            case 'workflows':
                return this.prisma.workflow.findMany({ where: { tenantId } });
            case 'timesheets':
                return this.prisma.timesheet.findMany({ where: { tenantId } });
            case 'expenses':
                return this.prisma.expense.findMany({ where: { tenantId } });
            default:
                return [];
        }
    }
}
