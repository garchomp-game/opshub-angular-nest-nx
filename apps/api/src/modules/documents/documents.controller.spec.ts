import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

describe('DocumentsController', () => {
    let controller: DocumentsController;
    let service: jest.Mocked<DocumentsService>;

    const mockUser = {
        id: 'user-001',
        email: 'test@demo.com',
        displayName: 'テスト太郎',
        tenantIds: ['tenant-001'],
        roles: [{ tenantId: 'tenant-001', role: 'pm' }],
    };

    const mockDocument = {
        id: 'doc-001',
        tenantId: 'tenant-001',
        projectId: 'proj-001',
        name: 'test.pdf',
        filePath: 'tenant-001/proj-001/uuid_test.pdf',
        fileSize: BigInt(1024),
        mimeType: 'application/pdf',
        uploadedBy: 'user-001',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockPaginatedResult = {
        data: [mockDocument],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DocumentsController],
            providers: [
                {
                    provide: DocumentsService,
                    useValue: {
                        findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
                        upload: jest.fn().mockResolvedValue(mockDocument),
                        getDownloadInfo: jest.fn().mockResolvedValue({
                            buffer: Buffer.from('content'),
                            filename: 'test.pdf',
                            mimeType: 'application/pdf',
                        }),
                        remove: jest.fn().mockResolvedValue(undefined),
                    },
                },
            ],
        }).compile();

        controller = module.get<DocumentsController>(DocumentsController);
        service = module.get(DocumentsService) as jest.Mocked<DocumentsService>;
    });

    afterEach(() => jest.clearAllMocks());

    // ─── findAll ───

    describe('GET /projects/:projectId/documents', () => {
        it('DocumentsService.findAll に委譲すること', async () => {
            const result = await controller.findAll('proj-001', {}, mockUser as any);

            expect(service.findAll).toHaveBeenCalledWith('tenant-001', 'proj-001', {});
            expect(result).toEqual(mockPaginatedResult);
        });
    });

    // ─── upload ───

    describe('POST /projects/:projectId/documents', () => {
        it('DocumentsService.upload に委譲すること', async () => {
            const mockFile = {
                originalname: 'test.pdf',
                mimetype: 'application/pdf',
                size: 1024,
                buffer: Buffer.from('content'),
            } as any;

            const result = await controller.upload('proj-001', mockFile, mockUser as any);

            expect(service.upload).toHaveBeenCalledWith(
                'tenant-001',
                'proj-001',
                'user-001',
                mockFile,
            );
            expect(result).toEqual(mockDocument);
        });

        it('ファイル未指定で BadRequestException を投げること', async () => {
            await expect(
                controller.upload('proj-001', undefined as any, mockUser as any),
            ).rejects.toThrow();
        });
    });

    // ─── download ───

    describe('GET /documents/:id/download', () => {
        it('DocumentsService.getDownloadInfo に委譲してレスポンスを返すこと', async () => {
            const mockRes = {
                set: jest.fn(),
                send: jest.fn(),
            } as any;

            await controller.download('doc-001', mockUser as any, mockRes);

            expect(service.getDownloadInfo).toHaveBeenCalledWith('tenant-001', 'doc-001');
            expect(mockRes.set).toHaveBeenCalledWith(
                expect.objectContaining({
                    'Content-Type': 'application/pdf',
                }),
            );
            expect(mockRes.send).toHaveBeenCalled();
        });
    });

    // ─── remove ───

    describe('DELETE /documents/:id', () => {
        it('DocumentsService.remove に委譲すること', async () => {
            await controller.remove('doc-001', mockUser as any);

            expect(service.remove).toHaveBeenCalledWith('tenant-001', 'doc-001');
        });
    });
});
