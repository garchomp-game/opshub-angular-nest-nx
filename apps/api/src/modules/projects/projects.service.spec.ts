import { Test, TestingModule } from '@nestjs/testing';

import {
    NotFoundException, ConflictException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '@prisma-db';

describe('ProjectsService', () => {
    let service: ProjectsService;

    // ─── Prisma Mock ───
    const mockPrisma = {
        project: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        projectMember: {
            create: jest.fn(),
            findFirst: jest.fn(),
            delete: jest.fn(),
        },
        task: {
            count: jest.fn(),
        },
    };

    // ─── テストデータ ───
    const tenantId = 'tenant-001';
    const userId = 'user-001';
    const pmId = 'pm-001';

    const mockProject = {
        id: 'proj-001',
        tenantId,
        name: 'テストプロジェクト',
        description: 'テスト用',
        status: 'planning',
        pmId,
        createdBy: userId,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectsService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<ProjectsService>(ProjectsService);
        jest.clearAllMocks();
    });

    // ─── findAll ───
    describe('findAll', () => {
        it('テナント内のプロジェクト一覧を返すこと', async () => {
            mockPrisma.project.findMany.mockResolvedValue([mockProject]);
            mockPrisma.project.count.mockResolvedValue(1);

            const result = await service.findAll(tenantId, userId, {});

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tenantId }),
                }),
            );
        });

        it('ステータスフィルタが適用されること', async () => {
            mockPrisma.project.findMany.mockResolvedValue([]);
            mockPrisma.project.count.mockResolvedValue(0);

            await service.findAll(tenantId, userId, { status: 'active' });

            expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tenantId, status: 'active' }),
                }),
            );
        });

        it('ページネーションが正しく計算されること', async () => {
            mockPrisma.project.findMany.mockResolvedValue([]);
            mockPrisma.project.count.mockResolvedValue(50);

            const result = await service.findAll(tenantId, userId, { page: 2, limit: 10 });

            expect(result.meta.totalPages).toBe(5);
            expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 10, take: 10 }),
            );
        });
    });

    // ─── findOne ───
    describe('findOne', () => {
        it('存在するプロジェクトを返すこと', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(mockProject);
            mockPrisma.task.count.mockResolvedValue(0);

            const result = await service.findOne(tenantId, 'proj-001');

            expect(result.id).toBe('proj-001');
            expect(result.taskStats).toBeDefined();
        });

        it('存在しない場合 NotFoundException を投げること', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(null);

            await expect(service.findOne(tenantId, 'nonexist'))
                .rejects.toThrow(NotFoundException);
        });
    });

    // ─── create ───
    describe('create', () => {
        const createDto = {
            name: '新規PJ',
            pmId,
            status: 'planning' as const,
        };

        it('プロジェクトを作成しPMをメンバー追加すること', async () => {
            mockPrisma.project.create.mockResolvedValue({ ...mockProject, id: 'proj-new' });
            mockPrisma.projectMember.create.mockResolvedValue({});

            const result = await service.create(tenantId, userId, createDto);

            expect(result.id).toBe('proj-new');
            expect(mockPrisma.projectMember.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ userId: pmId }),
                }),
            );
        });

        it('P2002 で ConflictException を投げること', async () => {
            const prismaError = new Error('Unique constraint failed') as any;
            prismaError.code = 'P2002';
            mockPrisma.project.create.mockRejectedValue(prismaError);

            await expect(service.create(tenantId, userId, createDto))
                .rejects.toThrow(ConflictException);
        });

        it('終了日が開始日より前の場合 BadRequestException を投げること', async () => {
            await expect(
                service.create(tenantId, userId, {
                    ...createDto,
                    startDate: '2026-06-01',
                    endDate: '2026-01-01',
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ─── update ───
    describe('update', () => {
        it('プロジェクトを更新すること', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(mockProject);
            mockPrisma.project.update.mockResolvedValue({
                ...mockProject, name: '更新済み',
            });

            const result = await service.update(tenantId, 'proj-001', { name: '更新済み' });

            expect(result.name).toBe('更新済み');
        });

        it('不正なステータス遷移で BadRequestException を投げること', async () => {
            mockPrisma.project.findUnique.mockResolvedValue({
                ...mockProject, status: 'completed',
            });

            await expect(
                service.update(tenantId, 'proj-001', { status: 'planning' }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ─── addMember ───
    describe('addMember', () => {
        it('メンバーを追加すること', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(mockProject);
            mockPrisma.projectMember.create.mockResolvedValue({
                id: 'member-001', projectId: 'proj-001', userId: 'user-002',
            });

            const result = await service.addMember(tenantId, 'proj-001', { userId: 'user-002' });

            expect(result.userId).toBe('user-002');
        });

        it('重複メンバーで ConflictException を投げること (ERR-PJ-005)', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(mockProject);
            const prismaError = new Error('Unique constraint failed') as any;
            prismaError.code = 'P2002';
            mockPrisma.projectMember.create.mockRejectedValue(prismaError);

            await expect(
                service.addMember(tenantId, 'proj-001', { userId: 'user-002' }),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ─── removeMember ───
    describe('removeMember', () => {
        it('メンバーを削除すること', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(mockProject);
            mockPrisma.projectMember.findFirst.mockResolvedValue({ id: 'member-001' });
            mockPrisma.projectMember.delete.mockResolvedValue({});

            await service.removeMember(tenantId, 'proj-001', 'user-002');

            expect(mockPrisma.projectMember.delete).toHaveBeenCalled();
        });

        it('PMを削除しようとすると ForbiddenException を投げること (ERR-PJ-006)', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(mockProject);

            await expect(
                service.removeMember(tenantId, 'proj-001', pmId),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});
