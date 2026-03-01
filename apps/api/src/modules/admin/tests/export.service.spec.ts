import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { ExportService } from '../services/export.service';
import { PrismaService } from '@prisma-db';

describe('ExportService', () => {
    let service: ExportService;

    const mockQueue = {
        add: jest.fn(),
        getJob: jest.fn(),
    };

    const mockPrisma = {
        auditLog: { create: jest.fn() },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExportService,
                { provide: getQueueToken('tenant-export'), useValue: mockQueue },
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<ExportService>(ExportService);
        jest.clearAllMocks();
    });

    describe('requestExport', () => {
        it('BullMQ にジョブを投入し jobId を返すこと', async () => {
            mockQueue.add.mockResolvedValue({ id: 'job-001' });
            mockPrisma.auditLog.create.mockResolvedValue({});

            const result = await service.requestExport('tenant-001', 'user-001', {
                format: 'json',
                include: ['users', 'projects'],
            });

            expect(result).toEqual({ jobId: 'job-001', status: 'queued' });
            expect(mockQueue.add).toHaveBeenCalledWith('export', {
                tenantId: 'tenant-001',
                userId: 'user-001',
                format: 'json',
                include: ['users', 'projects'],
            });
        });

        it('監査ログが記録されること', async () => {
            mockQueue.add.mockResolvedValue({ id: 'job-002' });
            mockPrisma.auditLog.create.mockResolvedValue({});

            await service.requestExport('tenant-001', 'user-001', {
                format: 'csv',
                include: ['expenses'],
            });

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    tenantId: 'tenant-001',
                    userId: 'user-001',
                    action: 'tenant.export',
                    resourceType: 'tenant',
                }),
            });
        });
    });

    describe('getExportStatus', () => {
        it('ジョブの状態を返すこと (completed)', async () => {
            mockQueue.getJob.mockResolvedValue({
                id: 'job-001',
                progress: 100,
                returnvalue: '/exports/t/export-job-001.json',
                failedReason: null,
                getState: jest.fn().mockResolvedValue('completed'),
            });

            const result = await service.getExportStatus('job-001');

            expect(result).toEqual({
                jobId: 'job-001',
                status: 'completed',
                progress: 100,
                filePath: '/exports/t/export-job-001.json',
            });
        });

        it('ジョブの状態を返すこと (failed)', async () => {
            mockQueue.getJob.mockResolvedValue({
                id: 'job-002',
                progress: 50,
                returnvalue: null,
                failedReason: 'DB error',
                getState: jest.fn().mockResolvedValue('failed'),
            });

            const result = await service.getExportStatus('job-002');

            expect(result).toEqual({
                jobId: 'job-002',
                status: 'failed',
                progress: 50,
                error: 'DB error',
            });
        });

        it('ジョブが見つからない場合 NotFoundException をスローすること', async () => {
            mockQueue.getJob.mockResolvedValue(null);

            await expect(service.getExportStatus('nonexistent'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('getExportFile', () => {
        it('完了済みジョブのファイルパスを返すこと', async () => {
            mockQueue.getJob.mockResolvedValue({
                returnvalue: '/exports/t/export-job-001.json',
                getState: jest.fn().mockResolvedValue('completed'),
            });

            const result = await service.getExportFile('job-001');
            expect(result).toBe('/exports/t/export-job-001.json');
        });

        it('未完了のジョブの場合 NotFoundException をスローすること', async () => {
            mockQueue.getJob.mockResolvedValue({
                returnvalue: null,
                getState: jest.fn().mockResolvedValue('active'),
            });

            await expect(service.getExportFile('job-active'))
                .rejects.toThrow(NotFoundException);
        });

        it('ジョブが見つからない場合 NotFoundException をスローすること', async () => {
            mockQueue.getJob.mockResolvedValue(null);

            await expect(service.getExportFile('nonexistent'))
                .rejects.toThrow(NotFoundException);
        });
    });
});
