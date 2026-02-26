import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

describe('ExpensesController', () => {
    let controller: ExpensesController;
    let service: jest.Mocked<ExpensesService>;

    const mockUser = {
        id: 'user-001',
        email: 'test@demo.com',
        displayName: 'テスト太郎',
        tenantId: 'tenant-001',
        tenantIds: ['tenant-001'],
        roles: [{ tenantId: 'tenant-001', role: 'member' as any }],
    };

    const mockExpense = {
        id: 'exp-001',
        category: '交通費',
        amount: 15000,
        expenseDate: new Date('2026-02-20'),
        project: { id: 'proj-001', name: 'ECサイト' },
        workflow: { id: 'wf-001', status: 'submitted', workflowNumber: 'WF-0001' },
        createdBy: { id: 'user-001', displayName: '田中太郎' },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ExpensesController],
            providers: [
                {
                    provide: ExpensesService,
                    useValue: {
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        getSummaryByCategory: jest.fn(),
                        getSummaryByProject: jest.fn(),
                        getSummaryByMonth: jest.fn(),
                        getStats: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<ExpensesController>(ExpensesController);
        service = module.get(ExpensesService) as jest.Mocked<ExpensesService>;
    });

    afterEach(() => jest.clearAllMocks());

    // ─── findAll ───
    describe('GET /expenses', () => {
        it('Service.findAll に委譲すること', async () => {
            const expected = { data: [mockExpense], total: 1, page: 1, limit: 20 };
            service.findAll.mockResolvedValue(expected as any);

            const result = await controller.findAll(mockUser, {});

            expect(result).toEqual(expected);
            expect(service.findAll).toHaveBeenCalledWith('tenant-001', 'user-001', {});
        });
    });

    // ─── findOne ───
    describe('GET /expenses/:id', () => {
        it('Service.findOne に委譲すること', async () => {
            service.findOne.mockResolvedValue(mockExpense as any);

            const result = await controller.findOne(mockUser, 'exp-001');

            expect(result).toEqual(mockExpense);
            expect(service.findOne).toHaveBeenCalledWith('tenant-001', 'exp-001');
        });
    });

    // ─── create ───
    describe('POST /expenses', () => {
        it('Service.create に委譲すること', async () => {
            service.create.mockResolvedValue(mockExpense as any);
            const dto = {
                category: '交通費',
                amount: 15000,
                expenseDate: '2026-02-20',
                projectId: 'proj-001',
                approverId: 'approver-001',
            };

            const result = await controller.create(mockUser, dto);

            expect(result).toEqual(mockExpense);
            expect(service.create).toHaveBeenCalledWith('tenant-001', 'user-001', dto);
        });
    });

    // ─── summaryByCategory ───
    describe('GET /expenses/summary/by-category', () => {
        it('Service.getSummaryByCategory に委譲すること', async () => {
            const expected = [{ category: '交通費', count: 25, totalAmount: 375000, percentage: 45.2 }];
            service.getSummaryByCategory.mockResolvedValue(expected as any);
            const query = { dateFrom: '2026-02-01', dateTo: '2026-02-28' };

            const result = await controller.summaryByCategory(mockUser, query);

            expect(result).toEqual(expected);
            expect(service.getSummaryByCategory).toHaveBeenCalledWith('tenant-001', query);
        });
    });

    // ─── summaryByProject ───
    describe('GET /expenses/summary/by-project', () => {
        it('Service.getSummaryByProject に委譲すること', async () => {
            const expected = [{ projectId: 'proj-001', projectName: 'ECサイト', count: 10, totalAmount: 200000 }];
            service.getSummaryByProject.mockResolvedValue(expected as any);
            const query = { dateFrom: '2026-02-01', dateTo: '2026-02-28' };

            const result = await controller.summaryByProject(mockUser, query);

            expect(result).toEqual(expected);
        });
    });

    // ─── summaryByMonth ───
    describe('GET /expenses/summary/by-month', () => {
        it('Service.getSummaryByMonth に委譲すること', async () => {
            const expected = [{ month: '2026-02', count: 30, totalAmount: 500000 }];
            service.getSummaryByMonth.mockResolvedValue(expected as any);
            const query = { dateFrom: '2026-01-01', dateTo: '2026-12-31' };

            const result = await controller.summaryByMonth(mockUser, query);

            expect(result).toEqual(expected);
        });
    });

    // ─── summaryStats ───
    describe('GET /expenses/summary/stats', () => {
        it('Service.getStats に委譲すること', async () => {
            const expected = { totalAmount: 830000, totalCount: 55, avgAmount: 15091, maxAmount: 120000 };
            service.getStats.mockResolvedValue(expected as any);
            const query = { dateFrom: '2026-02-01', dateTo: '2026-02-28' };

            const result = await controller.summaryStats(mockUser, query);

            expect(result).toEqual(expected);
            expect(service.getStats).toHaveBeenCalledWith('tenant-001', query);
        });
    });
});
