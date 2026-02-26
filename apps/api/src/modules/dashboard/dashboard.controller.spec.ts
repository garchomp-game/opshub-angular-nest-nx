import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
    let controller: DashboardController;
    let service: jest.Mocked<DashboardService>;

    const mockUser = {
        id: 'user-001',
        tenantId: 'tenant-001',
        roles: [{ tenantId: 'tenant-001', role: 'member' }],
    };

    const mockDashboardData = {
        kpi: { pendingApprovals: 0, myWorkflows: 5, myTasks: 3, weeklyHours: 20 },
        recentNotifications: [],
        quickActions: [{ label: '新規申請', icon: 'add', routerLink: '/workflows/new', roles: ['member'] }],
    };

    const mockKpiData = {
        pendingApprovals: 0,
        myWorkflows: 5,
        myTasks: 3,
        weeklyHours: 20,
    };

    const mockProjectProgress = [
        { projectId: 'pj-001', projectName: 'PJ1', totalTasks: 10, completedTasks: 3, progressPercent: 30 },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DashboardController],
            providers: [
                {
                    provide: DashboardService,
                    useValue: {
                        getDashboardData: jest.fn().mockResolvedValue(mockDashboardData),
                        getKpi: jest.fn().mockResolvedValue(mockKpiData),
                        getProjectProgress: jest.fn().mockResolvedValue(mockProjectProgress),
                    },
                },
            ],
        }).compile();

        controller = module.get<DashboardController>(DashboardController);
        service = module.get(DashboardService) as jest.Mocked<DashboardService>;
    });

    afterEach(() => jest.clearAllMocks());

    // ─── GET /dashboard ───
    describe('getDashboard', () => {
        it('Service.getDashboardData に委譲すること', async () => {
            const result = await controller.getDashboard(mockUser);

            expect(result).toEqual(mockDashboardData);
            expect(service.getDashboardData).toHaveBeenCalledWith(
                mockUser.tenantId, mockUser.id, ['member'],
            );
        });
    });

    // ─── GET /dashboard/kpi ───
    describe('getKpi', () => {
        it('Service.getKpi に委譲すること', async () => {
            const result = await controller.getKpi(mockUser);

            expect(result).toEqual(mockKpiData);
            expect(service.getKpi).toHaveBeenCalledWith(
                mockUser.tenantId, mockUser.id, ['member'],
            );
        });
    });

    // ─── GET /dashboard/project-progress ───
    describe('getProjectProgress', () => {
        it('Service.getProjectProgress に委譲すること', async () => {
            const result = await controller.getProjectProgress(mockUser);

            expect(result).toEqual(mockProjectProgress);
            expect(service.getProjectProgress).toHaveBeenCalledWith(mockUser.tenantId);
        });
    });
});
