import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '@prisma-db';

describe('DashboardService', () => {
    let service: DashboardService;

    // ─── Prisma Mock ───
    const mockPrisma: any = {
        workflow: {
            count: jest.fn(),
        },
        task: {
            count: jest.fn(),
        },
        timesheet: {
            aggregate: jest.fn(),
        },
        notification: {
            findMany: jest.fn(),
        },
        project: {
            findMany: jest.fn(),
        },
    };

    const tenantId = 'tenant-001';
    const userId = 'user-001';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<DashboardService>(DashboardService);
        jest.clearAllMocks();
    });

    // ─── getDashboardData ───
    describe('getDashboardData', () => {
        it('approver ロールで承認待ち件数が含まれること', async () => {
            mockPrisma.workflow.count.mockResolvedValue(3);
            mockPrisma.task.count.mockResolvedValue(0);
            mockPrisma.timesheet.aggregate.mockResolvedValue({ _sum: { hours: 0 } });
            mockPrisma.notification.findMany.mockResolvedValue([]);

            const result = await service.getDashboardData(tenantId, userId, ['approver']);

            expect(result.kpi.pendingApprovals).toBe(3);
            expect(result.kpi.myWorkflows).toBe(3); // same count mock
            expect(result.recentNotifications).toEqual([]);
            expect(result.quickActions.length).toBeGreaterThan(0);
        });

        it('member ロールで承認待ちが 0、タスクと工数が含まれること', async () => {
            mockPrisma.workflow.count.mockResolvedValue(5);
            mockPrisma.task.count.mockResolvedValue(7);
            mockPrisma.timesheet.aggregate.mockResolvedValue({ _sum: { hours: 16.5 } });
            mockPrisma.notification.findMany.mockResolvedValue([
                { id: 'n-001', title: 'テスト通知' },
            ]);

            const result = await service.getDashboardData(tenantId, userId, ['member']);

            expect(result.kpi.pendingApprovals).toBe(0); // member は承認権限なし
            expect(result.kpi.myWorkflows).toBe(5);
            expect(result.kpi.myTasks).toBe(7);
            expect(result.kpi.weeklyHours).toBe(16.5);
            expect(result.recentNotifications).toHaveLength(1);
        });

        it('tenant_admin ロールで全 KPI が含まれること', async () => {
            mockPrisma.workflow.count.mockResolvedValue(2);
            mockPrisma.task.count.mockResolvedValue(10);
            mockPrisma.timesheet.aggregate.mockResolvedValue({ _sum: { hours: 40 } });
            mockPrisma.notification.findMany.mockResolvedValue([]);

            const result = await service.getDashboardData(tenantId, userId, ['tenant_admin']);

            expect(result.kpi.pendingApprovals).toBe(2);
            expect(result.kpi.myWorkflows).toBe(2);
            expect(result.kpi.myTasks).toBe(10);
            expect(result.kpi.weeklyHours).toBe(40);
        });
    });

    // ─── getKpi ───
    describe('getKpi', () => {
        it('KPI データのみ返すこと', async () => {
            mockPrisma.workflow.count.mockResolvedValue(1);
            mockPrisma.task.count.mockResolvedValue(3);
            mockPrisma.timesheet.aggregate.mockResolvedValue({ _sum: { hours: 8 } });

            const result = await service.getKpi(tenantId, userId, ['pm']);

            expect(result).toEqual({
                pendingApprovals: 0, // pm は approver ではない
                myWorkflows: 1,
                myTasks: 3,
                weeklyHours: 8,
            });
        });
    });

    // ─── getProjectProgress ───
    describe('getProjectProgress', () => {
        it('プロジェクト進捗率を返すこと', async () => {
            mockPrisma.project.findMany.mockResolvedValue([
                {
                    id: 'pj-001',
                    name: 'テストPJ',
                    _count: { tasks: 10 },
                    tasks: [{ id: 't-1' }, { id: 't-2' }, { id: 't-3' }],
                },
                {
                    id: 'pj-002',
                    name: '空PJ',
                    _count: { tasks: 0 },
                    tasks: [],
                },
            ]);

            const result = await service.getProjectProgress(tenantId);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                projectId: 'pj-001',
                projectName: 'テストPJ',
                totalTasks: 10,
                completedTasks: 3,
                progressPercent: 30,
            });
            expect(result[1].progressPercent).toBe(0);
        });
    });

    // ─── getQuickActions ───
    describe('getQuickActions', () => {
        it('member ロールに応じたアクションを返すこと', () => {
            const actions = service.getQuickActions(['member']);

            expect(actions.length).toBe(3);
            expect(actions.map(a => a.routerLink)).toContain('/workflows/new');
            expect(actions.map(a => a.routerLink)).toContain('/timesheets');
            expect(actions.map(a => a.routerLink)).toContain('/projects');
        });

        it('approver ロールでは工数入力が含まれないこと', () => {
            const actions = service.getQuickActions(['approver']);

            expect(actions.map(a => a.routerLink)).toContain('/workflows/new');
            expect(actions.map(a => a.routerLink)).not.toContain('/timesheets');
        });
    });
});
