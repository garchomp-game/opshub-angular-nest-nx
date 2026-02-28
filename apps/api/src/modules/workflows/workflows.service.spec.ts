import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { PrismaService } from '@prisma-db';
import { NotificationsService } from '../notifications/notifications.service';

describe('WorkflowsService', () => {
    let service: WorkflowsService;

    // ─── Prisma Mock ───
    const mockPrisma: any = {
        workflow: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        tenant: {
            update: jest.fn(),
        },
        $transaction: jest.fn((fn: any) => fn(mockPrisma)),
    };

    // ─── Notifications Mock ───
    const mockNotifications = {
        create: jest.fn(),
    };

    // ─── テストデータ ───
    const tenantId = 'tenant-001';
    const userId = 'user-001';
    const approverId = 'approver-001';

    const mockWorkflow = {
        id: 'wf-001',
        tenantId,
        workflowNumber: 'WF-001',
        type: 'expense',
        title: 'テスト申請',
        description: '経費申請テスト',
        status: 'submitted',
        amount: 10000,
        createdBy: userId,
        approverId,
        rejectionReason: null,
        approvedAt: null,
        dateFrom: null,
        dateTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: { id: userId, profile: { displayName: 'テスト太郎' } },
        approver: { id: approverId, profile: { displayName: '承認者花子' } },
        attachments: [],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WorkflowsService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: NotificationsService, useValue: mockNotifications },
            ],
        }).compile();

        service = module.get<WorkflowsService>(WorkflowsService);
        jest.clearAllMocks();
    });

    // ─── findAll ───
    describe('findAll', () => {
        it('テナント内のワークフロー一覧を返すこと', async () => {
            mockPrisma.workflow.findMany.mockResolvedValue([mockWorkflow]);
            mockPrisma.workflow.count.mockResolvedValue(1);

            const result = await service.findAll(tenantId, userId, {});

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tenantId }),
                }),
            );
        });

        it('ステータスフィルタが適用されること', async () => {
            mockPrisma.workflow.findMany.mockResolvedValue([]);
            mockPrisma.workflow.count.mockResolvedValue(0);

            await service.findAll(tenantId, userId, { status: 'draft' });

            expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tenantId, status: 'draft' }),
                }),
            );
        });

        it('ページネーションが正しく動作すること', async () => {
            mockPrisma.workflow.findMany.mockResolvedValue([]);
            mockPrisma.workflow.count.mockResolvedValue(50);

            const result = await service.findAll(tenantId, userId, { page: 2, limit: 10 });

            expect(result.meta.totalPages).toBe(5);
            expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 10,
                }),
            );
        });
    });

    // ─── findPending ───
    describe('findPending', () => {
        it('承認待ち一覧を返すこと', async () => {
            mockPrisma.workflow.findMany.mockResolvedValue([mockWorkflow]);

            const result = await service.findPending(tenantId, approverId);

            expect(result).toHaveLength(1);
            expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { tenantId, approverId, status: 'submitted' },
                }),
            );
        });
    });

    // ─── findOne ───
    describe('findOne', () => {
        it('存在するワークフローを返すこと', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);

            const result = await service.findOne(tenantId, 'wf-001');

            expect(result).toEqual(mockWorkflow);
        });

        it('存在しない場合 NotFoundException を投げること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue(null);

            await expect(service.findOne(tenantId, 'nonexist'))
                .rejects.toThrow(NotFoundException);
        });

        it('別テナントのワークフローは NotFoundException を投げること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue({
                ...mockWorkflow,
                tenantId: 'other-tenant',
            });

            await expect(service.findOne(tenantId, 'wf-001'))
                .rejects.toThrow(NotFoundException);
        });
    });

    // ─── create ───
    describe('create', () => {
        it('下書きを作成できること', async () => {
            mockPrisma.tenant.update.mockResolvedValue({ workflowSeq: 1 });
            mockPrisma.workflow.create.mockResolvedValue({
                ...mockWorkflow, status: 'draft',
            });

            const result = await service.create(tenantId, userId, {
                type: 'expense',
                title: 'テスト申請',
                approverId,
                action: 'draft',
            });

            expect(result.status).toBe('draft');
            expect(mockNotifications.create).not.toHaveBeenCalled();
        });

        it('送信で作成すると通知が飛ぶこと', async () => {
            mockPrisma.tenant.update.mockResolvedValue({ workflowSeq: 2 });
            mockPrisma.workflow.create.mockResolvedValue(mockWorkflow);

            await service.create(tenantId, userId, {
                type: 'expense',
                title: 'テスト申請',
                approverId,
                action: 'submit',
            });

            expect(mockNotifications.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: approverId,
                    type: 'workflow.submitted',
                }),
            );
        });

        it('重複時に ConflictException を投げること', async () => {
            mockPrisma.tenant.update.mockResolvedValue({ workflowSeq: 1 });
            mockPrisma.workflow.create.mockRejectedValue({ code: 'P2002' });

            await expect(service.create(tenantId, userId, {
                type: 'expense',
                title: 'test',
                approverId,
                action: 'draft',
            })).rejects.toThrow(ConflictException);
        });
    });

    // ─── update ───
    describe('update', () => {
        it('下書き状態の申請を更新できること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue({
                ...mockWorkflow, status: 'draft',
            });
            mockPrisma.workflow.update.mockResolvedValue({
                ...mockWorkflow, status: 'draft', title: '更新済',
            });

            const result = await service.update(tenantId, 'wf-001', userId, { title: '更新済' });

            expect(result.title).toBe('更新済');
        });

        it('下書き以外は ConflictException を投げること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow); // status: submitted

            await expect(service.update(tenantId, 'wf-001', userId, { title: 'update' }))
                .rejects.toThrow(ConflictException);
        });

        it('他人の申請は ForbiddenException を投げること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue({
                ...mockWorkflow, status: 'draft',
            });

            await expect(service.update(tenantId, 'wf-001', 'other-user', { title: 'update' }))
                .rejects.toThrow(ForbiddenException);
        });
    });

    // ─── submit ───
    describe('submit', () => {
        it('draft → submitted に遷移すること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue({
                ...mockWorkflow, status: 'draft',
            });
            mockPrisma.workflow.update.mockResolvedValue({
                ...mockWorkflow, status: 'submitted',
            });

            const result = await service.submit(tenantId, 'wf-001', userId);

            expect(result.status).toBe('submitted');
            expect(mockNotifications.create).toHaveBeenCalled();
        });

        it('他人の申請は ForbiddenException を投げること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue({
                ...mockWorkflow, status: 'draft',
            });

            await expect(service.submit(tenantId, 'wf-001', 'other-user'))
                .rejects.toThrow(ForbiddenException);
        });
    });

    // ─── approve ───
    describe('approve', () => {
        it('submitted → approved に遷移すること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
            mockPrisma.workflow.update.mockResolvedValue({
                ...mockWorkflow, status: 'approved',
            });

            const result = await service.approve(tenantId, 'wf-001', approverId);

            expect(result.status).toBe('approved');
            expect(mockNotifications.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    type: 'workflow.approved',
                }),
            );
        });

        it('draft → approved は ConflictException を投げること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue({
                ...mockWorkflow, status: 'draft',
            });

            await expect(service.approve(tenantId, 'wf-001', approverId))
                .rejects.toThrow(ConflictException);
        });

        it('自分の申請は承認できないこと (ForbiddenException)', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);

            await expect(service.approve(tenantId, 'wf-001', userId))
                .rejects.toThrow(ForbiddenException);
        });
    });

    // ─── reject ───
    describe('reject', () => {
        it('submitted → rejected に遷移すること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
            mockPrisma.workflow.update.mockResolvedValue({
                ...mockWorkflow, status: 'rejected',
            });

            const result = await service.reject(tenantId, 'wf-001', approverId, '内容不備');

            expect(result.status).toBe('rejected');
            expect(mockNotifications.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    type: 'workflow.rejected',
                }),
            );
        });

        it('自分の申請は差戻しできないこと (ForbiddenException)', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);

            await expect(service.reject(tenantId, 'wf-001', userId, '理由'))
                .rejects.toThrow(ForbiddenException);
        });

        it('draft → rejected は ConflictException を投げること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue({
                ...mockWorkflow, status: 'draft',
            });

            await expect(service.reject(tenantId, 'wf-001', approverId, '理由'))
                .rejects.toThrow(ConflictException);
        });
    });

    // ─── withdraw ───
    describe('withdraw', () => {
        it('submitted → withdrawn に遷移すること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
            mockPrisma.workflow.update.mockResolvedValue({
                ...mockWorkflow, status: 'withdrawn',
            });

            const result = await service.withdraw(tenantId, 'wf-001', userId);

            expect(result.status).toBe('withdrawn');
        });

        it('他人の申請は取下げできないこと', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);

            await expect(service.withdraw(tenantId, 'wf-001', 'other-user'))
                .rejects.toThrow(ForbiddenException);
        });

        it('approved → withdrawn は ConflictException を投げること', async () => {
            mockPrisma.workflow.findUnique.mockResolvedValue({
                ...mockWorkflow, status: 'approved',
            });

            await expect(service.withdraw(tenantId, 'wf-001', userId))
                .rejects.toThrow(ConflictException);
        });
    });

    // ─── generateWorkflowNumber ───
    describe('generateWorkflowNumber', () => {
        it('WF-NNN 形式の番号を生成すること', async () => {
            mockPrisma.tenant.update.mockResolvedValue({ workflowSeq: 42 });

            const result = await service.generateWorkflowNumber(tenantId);

            expect(result).toBe('WF-042');
        });
    });
});
