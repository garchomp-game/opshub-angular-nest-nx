import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '@prisma-db';

describe('ExpensesService', () => {
    let service: ExpensesService;

    // ─── Prisma Mock ───
    const mockPrisma = {
        expense: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn(),
            aggregate: jest.fn(),
        },
        project: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        userRole: {
            findFirst: jest.fn(),
        },
        tenant: {
            update: jest.fn(),
        },
        workflow: {
            create: jest.fn(),
        },
        $transaction: jest.fn((fn: any) => fn(mockPrisma)),
    };

    // ─── テストデータ ───
    const tenantId = 'tenant-001';
    const userId = 'user-001';

    const mockExpense = {
        id: 'exp-001',
        tenantId,
        workflowId: 'wf-001',
        projectId: 'proj-001',
        category: '交通費',
        amount: 15000,
        expenseDate: new Date('2026-02-20'),
        description: 'クライアント訪問',
        receiptUrl: null,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        project: { id: 'proj-001', name: 'ECサイト' },
        workflow: { id: 'wf-001', status: 'submitted', workflowNumber: 'WF-0001' },
        creator: {
            id: userId,
            profile: { displayName: '田中太郎' },
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExpensesService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<ExpensesService>(ExpensesService);
        jest.clearAllMocks();
    });

    // ─── findAll ───
    describe('findAll', () => {
        it('経費一覧を返すこと', async () => {
            mockPrisma.expense.findMany.mockResolvedValue([mockExpense]);
            mockPrisma.expense.count.mockResolvedValue(1);

            const result = await service.findAll(tenantId, userId, {});

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.data[0].createdBy.displayName).toBe('田中太郎');
        });

        it('カテゴリフィルタが適用されること', async () => {
            mockPrisma.expense.findMany.mockResolvedValue([]);
            mockPrisma.expense.count.mockResolvedValue(0);

            await service.findAll(tenantId, userId, { category: '交通費' });

            expect(mockPrisma.expense.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ category: '交通費' }),
                }),
            );
        });
    });

    // ─── findOne ───
    describe('findOne', () => {
        it('経費詳細を返すこと', async () => {
            mockPrisma.expense.findUnique.mockResolvedValue(mockExpense);

            const result = await service.findOne(tenantId, 'exp-001');

            expect(result.id).toBe('exp-001');
            expect(result.createdBy.displayName).toBe('田中太郎');
        });

        it('存在しない場合 NotFoundException を投げること (ERR-EXP-001)', async () => {
            mockPrisma.expense.findUnique.mockResolvedValue(null);

            await expect(
                service.findOne(tenantId, 'nonexist'),
            ).rejects.toThrow(NotFoundException);
        });

        it('別テナントの経費は NotFoundException を投げること', async () => {
            mockPrisma.expense.findUnique.mockResolvedValue({
                ...mockExpense,
                tenantId: 'other-tenant',
            });

            await expect(
                service.findOne(tenantId, 'exp-001'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── create ───
    describe('create', () => {
        const createDto = {
            category: '交通費',
            amount: 15000,
            expenseDate: '2026-02-20',
            description: 'クライアント訪問',
            projectId: 'proj-001',
            approverId: 'approver-001',
            status: 'submitted' as const,
        };

        it('経費とワークフローを作成すること', async () => {
            mockPrisma.project.findUnique.mockResolvedValue({
                id: 'proj-001',
                tenantId,
            });
            mockPrisma.userRole.findFirst.mockResolvedValue({
                id: 'role-001',
                role: 'approver',
            });
            mockPrisma.tenant.update.mockResolvedValue({
                id: tenantId,
                workflowSeq: 42,
            });
            mockPrisma.workflow.create.mockResolvedValue({
                id: 'wf-new',
                workflowNumber: 'WF-0042',
            });
            mockPrisma.expense.create.mockResolvedValue({
                ...mockExpense,
                workflowId: 'wf-new',
            });

            const result = await service.create(tenantId, userId, createDto);

            expect(result.workflowId).toBe('wf-new');
            expect(mockPrisma.workflow.create).toHaveBeenCalled();
            expect(mockPrisma.expense.create).toHaveBeenCalled();
        });

        it('プロジェクト不存在で BadRequestException を投げること (ERR-VAL-004)', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(null);

            await expect(
                service.create(tenantId, userId, createDto),
            ).rejects.toThrow(BadRequestException);
        });

        it('承認者不存在で BadRequestException を投げること (ERR-VAL-005)', async () => {
            mockPrisma.project.findUnique.mockResolvedValue({
                id: 'proj-001',
                tenantId,
            });
            mockPrisma.userRole.findFirst.mockResolvedValue(null);

            await expect(
                service.create(tenantId, userId, createDto),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ─── getSummaryByCategory ───
    describe('getSummaryByCategory', () => {
        it('カテゴリ別集計を返すこと', async () => {
            mockPrisma.expense.groupBy.mockResolvedValue([
                { category: '交通費', _sum: { amount: 375000 }, _count: { id: 25 } },
                { category: '宿泊費', _sum: { amount: 455000 }, _count: { id: 30 } },
            ]);

            const result = await service.getSummaryByCategory(tenantId, {
                dateFrom: '2026-02-01',
                dateTo: '2026-02-28',
            });

            expect(result).toHaveLength(2);
            expect(result[0].category).toBe('交通費');
            expect(result[0].totalAmount).toBe(375000);
            expect(result[0].percentage).toBeGreaterThan(0);
        });

        it('日付範囲不正で BadRequestException を投げること (ERR-VAL-010)', async () => {
            await expect(
                service.getSummaryByCategory(tenantId, {
                    dateFrom: '2026-03-01',
                    dateTo: '2026-02-01',
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ─── getStats ───
    describe('getStats', () => {
        it('経費統計を返すこと', async () => {
            mockPrisma.expense.aggregate.mockResolvedValue({
                _sum: { amount: 830000 },
                _count: { id: 55 },
                _avg: { amount: 15090.9 },
                _max: { amount: 120000 },
            });

            const result = await service.getStats(tenantId, {
                dateFrom: '2026-02-01',
                dateTo: '2026-02-28',
            });

            expect(result.totalAmount).toBe(830000);
            expect(result.totalCount).toBe(55);
            expect(result.avgAmount).toBe(15091);
            expect(result.maxAmount).toBe(120000);
        });
    });
});
