import { Test, TestingModule } from '@nestjs/testing';
import { ExportProcessor } from '../processors/export.processor';
import { PrismaService } from '@prisma-db';
import { EventEmitter } from 'node:events';

// 出力ストリームへの参照を保持
let latestOutputStream: EventEmitter | null = null;

const mockWriteFileSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockCreateWriteStream = jest.fn(() => {
    latestOutputStream = new EventEmitter();
    return latestOutputStream;
});

// fs をパーシャルモック（Prisma の内部 require には影響しない）
jest.mock('node:fs', () => {
    const actualFs = jest.requireActual('node:fs');
    return {
        ...actualFs,
        mkdirSync: (...args: any[]) => mockMkdirSync(...args),
        writeFileSync: (...args: any[]) => mockWriteFileSync(...args),
        createWriteStream: (...args: any[]) => mockCreateWriteStream(...args),
    };
});

// archiver モック
jest.mock('archiver', () => {
    const resolveClose: (() => void) | null = null;
    return {
        create: jest.fn(() => ({
            pipe: jest.fn(),
            append: jest.fn(),
            finalize: jest.fn().mockImplementation(() => {
                if (latestOutputStream) {
                    process.nextTick(() => latestOutputStream!.emit('close'));
                }
            }),
            pointer: jest.fn().mockReturnValue(1024),
            on: jest.fn().mockReturnThis(),
        })),
    };
});

describe('ExportProcessor', () => {
    let processor: ExportProcessor;

    const mockPrisma = {
        userRole: { findMany: jest.fn() },
        project: { findMany: jest.fn() },
        workflow: { findMany: jest.fn() },
        timesheet: { findMany: jest.fn() },
        expense: { findMany: jest.fn() },
    };

    const createMockJob = (data: any) => ({
        id: 'test-job-001',
        data,
        updateProgress: jest.fn(),
    });

    beforeEach(async () => {
        mockWriteFileSync.mockClear();
        mockMkdirSync.mockClear();
        mockCreateWriteStream.mockClear();
        latestOutputStream = null;

        Object.values(mockPrisma).forEach((m) => (m.findMany as jest.Mock).mockReset());

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExportProcessor,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        processor = module.get<ExportProcessor>(ExportProcessor);
    });

    describe('JSON エクスポート', () => {
        it('JSON ファイルを生成して正しいパスを返すこと', async () => {
            mockPrisma.userRole.findMany.mockResolvedValue([
                { id: '1', user: { id: 'u1', email: 'a@test.com', profile: { displayName: 'A' } } },
            ]);
            mockPrisma.project.findMany.mockResolvedValue([
                { id: 'p1', name: 'Project 1' },
            ]);

            const job = createMockJob({
                tenantId: 'tenant-001',
                format: 'json',
                include: ['users', 'projects'],
            });

            const result = await processor.process(job as any);

            expect(result).toContain('export-test-job-001.json');
            expect(mockWriteFileSync).toHaveBeenCalledWith(
                expect.stringContaining('export-test-job-001.json'),
                expect.any(String),
                'utf-8',
            );
            expect(job.updateProgress).toHaveBeenCalledTimes(2);
        });
    });

    describe('CSV エクスポート', () => {
        it('ZIP ファイルのパスを返すこと', async () => {
            mockPrisma.userRole.findMany.mockResolvedValue([
                { id: '1', email: 'a@test.com' },
            ]);

            const job = createMockJob({
                tenantId: 'tenant-001',
                format: 'csv',
                include: ['users'],
            });

            const result = await processor.process(job as any);

            expect(result).toContain('export-test-job-001.zip');
        }, 10000);
    });

    describe('fetchTableData', () => {
        it('各テーブルの Prisma クエリが正しいテナントIDで呼ばれること', async () => {
            mockPrisma.userRole.findMany.mockResolvedValue([]);
            mockPrisma.project.findMany.mockResolvedValue([]);
            mockPrisma.workflow.findMany.mockResolvedValue([]);
            mockPrisma.timesheet.findMany.mockResolvedValue([]);
            mockPrisma.expense.findMany.mockResolvedValue([]);

            const job = createMockJob({
                tenantId: 'tenant-001',
                format: 'json',
                include: ['users', 'projects', 'workflows', 'timesheets', 'expenses'],
            });

            await processor.process(job as any);

            expect(mockPrisma.userRole.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { tenantId: 'tenant-001' } }),
            );
            expect(mockPrisma.project.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-001' } });
            expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-001' } });
            expect(mockPrisma.timesheet.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-001' } });
            expect(mockPrisma.expense.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-001' } });

            expect(job.updateProgress).toHaveBeenCalledTimes(5);
        });
    });
});
