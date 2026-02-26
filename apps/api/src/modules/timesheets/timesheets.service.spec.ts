import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { TimesheetsService } from './timesheets.service';
import { PrismaService } from '@prisma-db';

describe('TimesheetsService', () => {
    let service: TimesheetsService;

    // ─── Prisma Mock ───
    const mockPrisma = {
        timesheet: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
            aggregate: jest.fn(),
            groupBy: jest.fn(),
        },
        project: {
            findMany: jest.fn(),
        },
        profile: {
            findMany: jest.fn(),
        },
        $transaction: jest.fn((fn: any) => fn(mockPrisma)),
    };

    // ─── テストデータ ───
    const tenantId = 'tenant-001';
    const userId = 'user-001';
    const otherUserId = 'user-002';

    const mockEntry = {
        id: 'ts-001',
        tenantId,
        userId,
        projectId: 'proj-001',
        taskId: 'task-001',
        workDate: new Date('2026-02-25'),
        hours: 4.0,
        note: 'API設計',
        createdAt: new Date(),
        updatedAt: new Date(),
        project: { id: 'proj-001', name: 'ECサイト' },
        task: { id: 'task-001', title: 'API設計' },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TimesheetsService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<TimesheetsService>(TimesheetsService);
        jest.clearAllMocks();
    });

    // ─── getDailyTimesheets ───
    describe('getDailyTimesheets', () => {
        it('指定日の工数一覧を返すこと', async () => {
            mockPrisma.timesheet.findMany.mockResolvedValue([mockEntry]);

            const result = await service.getDailyTimesheets(tenantId, userId, {
                workDate: '2026-02-25',
            });

            expect(result.entries).toHaveLength(1);
            expect(result.totalHours).toBe(4.0);
            expect(mockPrisma.timesheet.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tenantId, userId }),
                }),
            );
        });
    });

    // ─── getWeeklyTimesheets ───
    describe('getWeeklyTimesheets', () => {
        it('指定週の工数一覧を返すこと', async () => {
            mockPrisma.timesheet.findMany.mockResolvedValue([mockEntry]);

            const result = await service.getWeeklyTimesheets(tenantId, userId, {
                weekStart: '2026-02-23',
            });

            expect(result.entries).toHaveLength(1);
            expect(result.weekStart).toBe('2026-02-23');
        });
    });

    // ─── create ───
    describe('create', () => {
        const createDto = {
            projectId: 'proj-001',
            taskId: 'task-001',
            workDate: '2026-02-25',
            hours: 4.0,
            note: 'テスト',
        };

        it('工数を作成して返すこと', async () => {
            mockPrisma.timesheet.aggregate.mockResolvedValue({
                _sum: { hours: 0 },
            });
            mockPrisma.timesheet.create.mockResolvedValue(mockEntry);

            const result = await service.create(tenantId, userId, createDto);

            expect(result).toEqual(mockEntry);
            expect(mockPrisma.timesheet.create).toHaveBeenCalled();
        });

        it('0.25刻みでない場合 BadRequestException を投げること (ERR-PJ-020)', async () => {
            await expect(
                service.create(tenantId, userId, { ...createDto, hours: 1.3 }),
            ).rejects.toThrow(BadRequestException);
        });

        it('1日合計24h超過時 BadRequestException を投げること (ERR-PJ-024)', async () => {
            mockPrisma.timesheet.aggregate.mockResolvedValue({
                _sum: { hours: 22 },
            });

            await expect(
                service.create(tenantId, userId, { ...createDto, hours: 4.0 }),
            ).rejects.toThrow(BadRequestException);
        });

        it('重複時に ConflictException を投げること (ERR-PJ-025)', async () => {
            mockPrisma.timesheet.aggregate.mockResolvedValue({
                _sum: { hours: 0 },
            });

            const { PrismaClientKnownRequestError } = await import(
                '@prisma/client/runtime/library'
            );
            mockPrisma.timesheet.create.mockRejectedValue(
                new PrismaClientKnownRequestError('Unique constraint failed', {
                    code: 'P2002',
                    clientVersion: '6.0.0',
                    meta: { target: ['userId', 'projectId', 'taskId', 'workDate'] },
                }),
            );

            await expect(
                service.create(tenantId, userId, createDto),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ─── bulkUpsert ───
    describe('bulkUpsert', () => {
        it('複数エントリを一括登録すること', async () => {
            mockPrisma.timesheet.create.mockResolvedValue(mockEntry);

            const result = await service.bulkUpsert(tenantId, userId, {
                entries: [
                    {
                        projectId: 'proj-001',
                        workDate: '2026-02-25',
                        hours: 4.0,
                    },
                ],
            });

            expect(result).toHaveLength(1);
        });

        it('既存エントリを更新すること', async () => {
            const existing = { ...mockEntry, userId };
            mockPrisma.timesheet.findUnique.mockResolvedValue(existing);
            mockPrisma.timesheet.update.mockResolvedValue({
                ...mockEntry,
                hours: 6.0,
            });

            const result = await service.bulkUpsert(tenantId, userId, {
                entries: [
                    {
                        id: 'ts-001',
                        projectId: 'proj-001',
                        workDate: '2026-02-25',
                        hours: 6.0,
                    },
                ],
            });

            expect(result).toHaveLength(1);
            expect(mockPrisma.timesheet.update).toHaveBeenCalled();
        });

        it('他ユーザーのエントリ更新で ForbiddenException を投げること', async () => {
            const otherEntry = { ...mockEntry, userId: otherUserId };
            mockPrisma.timesheet.findUnique.mockResolvedValue(otherEntry);

            await expect(
                service.bulkUpsert(tenantId, userId, {
                    entries: [
                        {
                            id: 'ts-001',
                            projectId: 'proj-001',
                            workDate: '2026-02-25',
                            hours: 4.0,
                        },
                    ],
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('指定IDの削除を実行すること', async () => {
            const owned = [{ ...mockEntry, userId }];
            mockPrisma.timesheet.findMany.mockResolvedValue(owned);
            mockPrisma.timesheet.deleteMany.mockResolvedValue({ count: 1 });

            const result = await service.bulkUpsert(tenantId, userId, {
                entries: [],
                deletedIds: ['ts-001'],
            });

            expect(mockPrisma.timesheet.deleteMany).toHaveBeenCalled();
            expect(result).toHaveLength(0);
        });
    });

    // ─── remove ───
    describe('remove', () => {
        it('自分の工数を削除すること', async () => {
            mockPrisma.timesheet.findUnique.mockResolvedValue(mockEntry);
            mockPrisma.timesheet.delete.mockResolvedValue(mockEntry);

            await service.remove(tenantId, userId, 'ts-001');

            expect(mockPrisma.timesheet.delete).toHaveBeenCalledWith({
                where: { id: 'ts-001' },
            });
        });

        it('存在しない場合 NotFoundException を投げること', async () => {
            mockPrisma.timesheet.findUnique.mockResolvedValue(null);

            await expect(
                service.remove(tenantId, userId, 'nonexist'),
            ).rejects.toThrow(NotFoundException);
        });

        it('他ユーザーの工数削除で ForbiddenException を投げること', async () => {
            mockPrisma.timesheet.findUnique.mockResolvedValue({
                ...mockEntry,
                userId: otherUserId,
            });

            await expect(
                service.remove(tenantId, userId, 'ts-001'),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── getProjectSummary ───
    describe('getProjectSummary', () => {
        it('プロジェクト別集計を返すこと', async () => {
            mockPrisma.timesheet.groupBy.mockResolvedValue([
                {
                    projectId: 'proj-001',
                    _sum: { hours: 40 },
                    _count: { id: 10 },
                },
            ]);
            mockPrisma.project.findMany.mockResolvedValue([
                { id: 'proj-001', name: 'ECサイト' },
            ]);

            const result = await service.getProjectSummary(tenantId, {
                dateFrom: '2026-02-01',
                dateTo: '2026-02-28',
            });

            expect(result).toHaveLength(1);
            expect(result[0].projectName).toBe('ECサイト');
            expect(result[0].totalHours).toBe(40);
        });
    });

    // ─── getUserSummary ───
    describe('getUserSummary', () => {
        it('ユーザー別集計を返すこと', async () => {
            mockPrisma.timesheet.groupBy.mockResolvedValue([
                {
                    userId: 'user-001',
                    _sum: { hours: 80 },
                    _count: { id: 20 },
                },
            ]);
            mockPrisma.profile.findMany.mockResolvedValue([
                { id: 'user-001', displayName: '田中太郎' },
            ]);

            const result = await service.getUserSummary(tenantId, {
                dateFrom: '2026-02-01',
                dateTo: '2026-02-28',
            });

            expect(result).toHaveLength(1);
            expect(result[0].userName).toBe('田中太郎');
            expect(result[0].totalHours).toBe(80);
        });
    });

    // ─── exportCsv ───
    describe('exportCsv', () => {
        it('CSV バッファを返すこと', async () => {
            mockPrisma.timesheet.findMany.mockResolvedValue([
                {
                    ...mockEntry,
                    user: { profile: { displayName: '田中太郎' } },
                },
            ]);

            const buffer = await service.exportCsv(tenantId, {
                dateFrom: '2026-02-01',
                dateTo: '2026-02-28',
            });

            expect(buffer).toBeInstanceOf(Buffer);
            const csv = buffer.toString('utf-8');
            expect(csv).toContain('プロジェクト名');
            expect(csv).toContain('ECサイト');
            expect(csv).toContain('田中太郎');
        });
    });
});
