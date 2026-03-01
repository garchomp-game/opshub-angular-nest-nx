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

    const mockAttachment = {
        id: 'att-001',
        tenantId: 'tenant-001',
        workflowId: 'wf-001',
        fileName: 'test.pdf',
        fileSize: 1024,
        contentType: 'application/pdf',
        storagePath: 'uploads/workflow-attachments/test.pdf',
        uploadedBy: 'user-001',
        createdAt: new Date(),
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
                        uploadAttachment: jest.fn().mockResolvedValue(mockAttachment),
                        getAttachments: jest.fn().mockResolvedValue([mockAttachment]),
                        deleteAttachment: jest.fn().mockResolvedValue(undefined),
                        getAttachmentFile: jest.fn().mockResolvedValue(mockAttachment),
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
                mockUser.tenantId, 'wf-001', mockUser.id, dto,
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

    // ─── POST /:id/attachments ───
    describe('uploadAttachment', () => {
        it('Service.uploadAttachment に委譲すること', async () => {
            const mockFile = {
                originalname: 'test.pdf',
                mimetype: 'application/pdf',
                size: 1024,
                filename: 'uuid-test.pdf',
            } as Express.Multer.File;

            const result = await controller.uploadAttachment('wf-001', mockFile, mockUser);

            expect(result).toEqual(mockAttachment);
            expect(service.uploadAttachment).toHaveBeenCalledWith(
                mockUser.tenantId, 'wf-001', mockFile, mockUser.id,
            );
        });
    });

    // ─── GET /:id/attachments ───
    describe('getAttachments', () => {
        it('Service.getAttachments に委譲すること', async () => {
            const result = await controller.getAttachments('wf-001', mockUser);

            expect(result).toEqual([mockAttachment]);
            expect(service.getAttachments).toHaveBeenCalledWith(
                mockUser.tenantId, 'wf-001',
            );
        });
    });

    // ─── DELETE /:id/attachments/:attachmentId ───
    describe('deleteAttachment', () => {
        it('Service.deleteAttachment に委譲すること', async () => {
            await controller.deleteAttachment('wf-001', 'att-001', mockUser);

            expect(service.deleteAttachment).toHaveBeenCalledWith(
                mockUser.tenantId, 'wf-001', 'att-001', mockUser.id,
            );
        });
    });

    // ─── GET /:id/attachments/:attachmentId/download ───
    describe('downloadAttachment', () => {
        it('Service.getAttachmentFile を呼ぶこと', async () => {
            await service.getAttachmentFile('tenant-001', 'wf-001', 'att-001');

            expect(service.getAttachmentFile).toHaveBeenCalledWith(
                'tenant-001', 'wf-001', 'att-001',
            );
        });
    });
});
