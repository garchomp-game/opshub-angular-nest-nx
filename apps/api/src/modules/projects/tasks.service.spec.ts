import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '@prisma-db';

describe('TasksService', () => {
    let service: TasksService;

    // ─── Prisma Mock ───
    const mockPrisma = {
        project: {
            findUnique: jest.fn(),
        },
        projectMember: {
            findFirst: jest.fn(),
        },
        task: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    // ─── テストデータ ───
    const tenantId = 'tenant-001';
    const projectId = 'proj-001';
    const userId = 'user-001';

    const mockProject = { id: projectId, tenantId, pmId: 'pm-001' };

    const mockTask = {
        id: 'task-001',
        tenantId,
        projectId,
        title: 'テストタスク',
        status: 'todo',
        assigneeId: userId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<TasksService>(TasksService);
        jest.clearAllMocks();
    });

    // ─── findByProject ───
    describe('findByProject', () => {
        it('プロジェクト内のタスク一覧を返すこと', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(mockProject);
            mockPrisma.task.findMany.mockResolvedValue([mockTask]);

            const result = await service.findByProject(tenantId, projectId);

            expect(result).toHaveLength(1);
            expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tenantId, projectId }),
                }),
            );
        });

        it('プロジェクトが存在しない場合 NotFoundException を投げること', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(null);

            await expect(service.findByProject(tenantId, 'nonexist'))
                .rejects.toThrow(NotFoundException);
        });
    });

    // ─── create ───
    describe('create', () => {
        it('タスクを作成すること', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(mockProject);
            mockPrisma.task.create.mockResolvedValue(mockTask);

            const result = await service.create(tenantId, projectId, userId, {
                title: 'テストタスク',
            });

            expect(result.title).toBe('テストタスク');
        });

        it('担当者がPJメンバーにいない場合 BadRequestException', async () => {
            mockPrisma.project.findUnique.mockResolvedValue(mockProject);
            mockPrisma.projectMember.findFirst.mockResolvedValue(null);

            await expect(
                service.create(tenantId, projectId, userId, {
                    title: 'タスク', assigneeId: 'unknown-user',
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ─── changeStatus ───
    describe('changeStatus', () => {
        it('todo → in_progress に遷移できること', async () => {
            mockPrisma.task.findUnique.mockResolvedValue({ ...mockTask, status: 'todo' });
            mockPrisma.task.update.mockResolvedValue({ ...mockTask, status: 'in_progress' });

            const result = await service.changeStatus(tenantId, 'task-001', {
                status: 'in_progress',
            });

            expect(result.status).toBe('in_progress');
        });

        it('in_progress → done に遷移できること', async () => {
            mockPrisma.task.findUnique.mockResolvedValue({ ...mockTask, status: 'in_progress' });
            mockPrisma.task.update.mockResolvedValue({ ...mockTask, status: 'done' });

            const result = await service.changeStatus(tenantId, 'task-001', {
                status: 'done',
            });

            expect(result.status).toBe('done');
        });

        it('todo → done は BadRequestException を投げること (ERR-PJ-012)', async () => {
            mockPrisma.task.findUnique.mockResolvedValue({ ...mockTask, status: 'todo' });

            await expect(
                service.changeStatus(tenantId, 'task-001', { status: 'done' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('done → todo は BadRequestException を投げること', async () => {
            mockPrisma.task.findUnique.mockResolvedValue({ ...mockTask, status: 'done' });

            await expect(
                service.changeStatus(tenantId, 'task-001', { status: 'todo' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('存在しないタスクで NotFoundException を投げること', async () => {
            mockPrisma.task.findUnique.mockResolvedValue(null);

            await expect(
                service.changeStatus(tenantId, 'nonexist', { status: 'in_progress' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── remove ───
    describe('remove', () => {
        it('タスクを削除すること', async () => {
            mockPrisma.task.findUnique.mockResolvedValue({
                ...mockTask, _count: { timesheets: 0 },
            });
            mockPrisma.task.delete.mockResolvedValue({});

            await service.remove(tenantId, 'task-001');

            expect(mockPrisma.task.delete).toHaveBeenCalled();
        });

        it('工数記録が紐づいている場合 ConflictException を投げること (ERR-PJ-014)', async () => {
            mockPrisma.task.findUnique.mockResolvedValue({
                ...mockTask, _count: { timesheets: 3 },
            });

            await expect(
                service.remove(tenantId, 'task-001'),
            ).rejects.toThrow(ConflictException);
        });
    });
});
