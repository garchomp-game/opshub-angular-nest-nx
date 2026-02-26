import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

describe('WorkflowsController', () => {
    let controller: WorkflowsController;
    let service: jest.Mocked<WorkflowsService>;

    const mockUser = {
        id: 'user-001',
        tenantId: 'tenant-001',
        email: 'user@demo.com',
        roles: [{ tenantId: 'tenant-001', role: 'approver' }],
    };

    const mockWorkflow = {
        id: 'wf-001',
        title: 'テスト申請',
        status: 'submitted',
    };

    const mockPaginatedResult = {
        data: [mockWorkflow],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [WorkflowsController],
            providers: [
                {
                    provide: WorkflowsService,
                    useValue: {
                        findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
                        findPending: jest.fn().mockResolvedValue([mockWorkflow]),
                        findOne: jest.fn().mockResolvedValue(mockWorkflow),
                        create: jest.fn().mockResolvedValue(mockWorkflow),
                        update: jest.fn().mockResolvedValue(mockWorkflow),
                        submit: jest.fn().mockResolvedValue({ ...mockWorkflow, status: 'submitted' }),
                        approve: jest.fn().mockResolvedValue({ ...mockWorkflow, status: 'approved' }),
                        reject: jest.fn().mockResolvedValue({ ...mockWorkflow, status: 'rejected' }),
                        withdraw: jest.fn().mockResolvedValue({ ...mockWorkflow, status: 'withdrawn' }),
                    },
                },
            ],
        }).compile();

        controller = module.get<WorkflowsController>(WorkflowsController);
        service = module.get(WorkflowsService) as jest.Mocked<WorkflowsService>;
    });

    afterEach(() => jest.clearAllMocks());

    // ─── GET / ───
    describe('findAll', () => {
        it('Service.findAll に委譲すること', async () => {
            const query = { status: 'submitted' as const };
            const result = await controller.findAll(mockUser, query);

            expect(result).toEqual(mockPaginatedResult);
            expect(service.findAll).toHaveBeenCalledWith(
                mockUser.tenantId, mockUser.id, query,
            );
        });
    });

    // ─── GET /pending ───
    describe('findPending', () => {
        it('Service.findPending に委譲すること', async () => {
            const result = await controller.findPending(mockUser);

            expect(result).toEqual([mockWorkflow]);
            expect(service.findPending).toHaveBeenCalledWith(
                mockUser.tenantId, mockUser.id,
            );
        });
    });

    // ─── GET /:id ───
    describe('findOne', () => {
        it('Service.findOne に委譲すること', async () => {
            const result = await controller.findOne('wf-001', mockUser);

            expect(result).toEqual(mockWorkflow);
            expect(service.findOne).toHaveBeenCalledWith(
                mockUser.tenantId, 'wf-001',
            );
        });
    });

    // ─── POST / ───
    describe('create', () => {
        it('Service.create に委譲すること', async () => {
            const dto = { type: 'expense', title: '経費', approverId: 'a-001', action: 'draft' as const };
            const result = await controller.create(dto, mockUser);

            expect(result).toEqual(mockWorkflow);
            expect(service.create).toHaveBeenCalledWith(
                mockUser.tenantId, mockUser.id, dto,
            );
        });
    });

    // ─── PATCH /:id ───
    describe('update', () => {
        it('Service.update に委譲すること', async () => {
            const dto = { title: '更新済' };
            const result = await controller.update('wf-001', dto, mockUser);

            expect(result).toEqual(mockWorkflow);
            expect(service.update).toHaveBeenCalledWith(
                mockUser.tenantId, 'wf-001', dto,
            );
        });
    });

    // ─── POST /:id/submit ───
    describe('submit', () => {
        it('Service.submit に委譲すること', async () => {
            await controller.submit('wf-001', mockUser);

            expect(service.submit).toHaveBeenCalledWith(
                mockUser.tenantId, 'wf-001', mockUser.id,
            );
        });
    });

    // ─── POST /:id/approve ───
    describe('approve', () => {
        it('Service.approve に委譲すること', async () => {
            const result = await controller.approve('wf-001', mockUser);

            expect(result.status).toBe('approved');
            expect(service.approve).toHaveBeenCalledWith(
                mockUser.tenantId, 'wf-001', mockUser.id,
            );
        });
    });

    // ─── POST /:id/reject ───
    describe('reject', () => {
        it('Service.reject に理由を渡して委譲すること', async () => {
            const dto = { reason: '内容不備' };
            await controller.reject('wf-001', dto, mockUser);

            expect(service.reject).toHaveBeenCalledWith(
                mockUser.tenantId, 'wf-001', mockUser.id, '内容不備',
            );
        });
    });

    // ─── POST /:id/withdraw ───
    describe('withdraw', () => {
        it('Service.withdraw に委譲すること', async () => {
            await controller.withdraw('wf-001', mockUser);

            expect(service.withdraw).toHaveBeenCalledWith(
                mockUser.tenantId, 'wf-001', mockUser.id,
            );
        });
    });
});
