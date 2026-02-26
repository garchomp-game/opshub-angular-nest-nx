import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '@prisma-db';
import { StorageService } from './storage/storage.service';

// uuid モック
jest.mock('uuid', () => ({
    v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('DocumentsService', () => {
    let service: DocumentsService;
    let prisma: any;
    let storage: jest.Mocked<StorageService>;

    const tenantId = 'tenant-001';
    const projectId = 'proj-001';
    const userId = 'user-001';

    const mockDocument = {
        id: 'doc-001',
        tenantId,
        projectId,
        name: 'test.pdf',
        filePath: `${tenantId}/${projectId}/mock-uuid_test.pdf`,
        fileSize: BigInt(1024),
        mimeType: 'application/pdf',
        uploadedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        uploader: {
            id: userId,
            profile: { displayName: 'テスト太郎' },
        },
    };

    const mockFile = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test content'),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
    } as any;

    beforeEach(async () => {
        prisma = {
            document: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                delete: jest.fn(),
                count: jest.fn(),
            },
        };

        storage = {
            upload: jest.fn().mockResolvedValue(undefined),
            download: jest.fn().mockResolvedValue(Buffer.from('file content')),
            getSignedUrl: jest.fn().mockResolvedValue('http://signed-url'),
            delete: jest.fn().mockResolvedValue(undefined),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DocumentsService,
                { provide: PrismaService, useValue: prisma },
                { provide: StorageService, useValue: storage },
            ],
        }).compile();

        service = module.get<DocumentsService>(DocumentsService);
    });

    afterEach(() => jest.clearAllMocks());

    // ─── findAll ───

    describe('findAll', () => {
        it('プロジェクト配下のドキュメント一覧を返すこと', async () => {
            prisma.document.findMany.mockResolvedValue([mockDocument]);
            prisma.document.count.mockResolvedValue(1);

            const result = await service.findAll(tenantId, projectId, {});

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(prisma.document.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { tenantId, projectId },
                }),
            );
        });

        it('ページネーションが正しく計算されること', async () => {
            prisma.document.findMany.mockResolvedValue([]);
            prisma.document.count.mockResolvedValue(50);

            const result = await service.findAll(tenantId, projectId, {
                page: 2,
                limit: 10,
            });

            expect(result.meta.totalPages).toBe(5);
            expect(prisma.document.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 10, take: 10 }),
            );
        });
    });

    // ─── upload ───

    describe('upload', () => {
        it('ファイルをアップロードしてドキュメントレコードを作成すること', async () => {
            prisma.document.create.mockResolvedValue(mockDocument);

            const result = await service.upload(tenantId, projectId, userId, mockFile);

            expect(storage.upload).toHaveBeenCalledWith(
                expect.stringContaining('mock-uuid_test.pdf'),
                mockFile.buffer,
                'application/pdf',
            );
            expect(prisma.document.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        tenantId,
                        projectId,
                        uploadedBy: userId,
                        name: 'test.pdf',
                        mimeType: 'application/pdf',
                    }),
                }),
            );
            expect(result).toEqual(mockDocument);
        });

        it('許可されていないMIMEタイプで BadRequestException を投げること', async () => {
            const invalidFile = { ...mockFile, mimetype: 'application/zip' };

            await expect(
                service.upload(tenantId, projectId, userId, invalidFile as any),
            ).rejects.toThrow(BadRequestException);
        });

        it('ファイルサイズ超過で BadRequestException を投げること', async () => {
            const largeFile = { ...mockFile, size: 11 * 1024 * 1024 };

            await expect(
                service.upload(tenantId, projectId, userId, largeFile as any),
            ).rejects.toThrow(BadRequestException);
        });

        it('Storage アップロード失敗で InternalServerErrorException を投げること', async () => {
            storage.upload.mockRejectedValue(new Error('Storage error'));

            await expect(
                service.upload(tenantId, projectId, userId, mockFile),
            ).rejects.toThrow(InternalServerErrorException);
        });

        it('DB 失敗時に Storage ファイルをロールバック削除すること', async () => {
            prisma.document.create.mockRejectedValue(new Error('DB error'));

            await expect(
                service.upload(tenantId, projectId, userId, mockFile),
            ).rejects.toThrow('DB error');

            expect(storage.delete).toHaveBeenCalled();
        });
    });

    // ─── getDownloadInfo ───

    describe('getDownloadInfo', () => {
        it('ダウンロード情報を返すこと', async () => {
            prisma.document.findFirst.mockResolvedValue(mockDocument);

            const result = await service.getDownloadInfo(tenantId, 'doc-001');

            expect(result.filename).toBe('test.pdf');
            expect(result.mimeType).toBe('application/pdf');
            expect(storage.download).toHaveBeenCalledWith(mockDocument.filePath);
        });

        it('存在しない場合 NotFoundException を投げること', async () => {
            prisma.document.findFirst.mockResolvedValue(null);

            await expect(
                service.getDownloadInfo(tenantId, 'nonexist'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── remove ───

    describe('remove', () => {
        it('ドキュメントを削除すること', async () => {
            prisma.document.findFirst.mockResolvedValue(mockDocument);

            await service.remove(tenantId, 'doc-001');

            expect(storage.delete).toHaveBeenCalledWith(mockDocument.filePath);
            expect(prisma.document.delete).toHaveBeenCalledWith({
                where: { id: 'doc-001' },
            });
        });

        it('存在しない場合 NotFoundException を投げること', async () => {
            prisma.document.findFirst.mockResolvedValue(null);

            await expect(
                service.remove(tenantId, 'nonexist'),
            ).rejects.toThrow(NotFoundException);
        });

        it('Storage 削除失敗で InternalServerErrorException を投げること', async () => {
            prisma.document.findFirst.mockResolvedValue(mockDocument);
            storage.delete.mockRejectedValue(new Error('Storage error'));

            await expect(
                service.remove(tenantId, 'doc-001'),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });
});
