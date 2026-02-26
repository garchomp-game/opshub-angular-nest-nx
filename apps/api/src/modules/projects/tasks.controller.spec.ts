import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
    let controller: TasksController;

    const mockService = {
        findByProject: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        changeStatus: jest.fn(),
        remove: jest.fn(),
    };

    const mockUser = {
        id: 'user-001',
        email: 'test@demo.com',
        displayName: 'テスト太郎',
        tenantId: 'tenant-001',
        tenantIds: ['tenant-001'],
        roles: [{ tenantId: 'tenant-001', role: 'pm' }],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TasksController],
            providers: [
                { provide: TasksService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<TasksController>(TasksController);
        jest.clearAllMocks();
    });

    it('findByProject が Service に委譲すること', async () => {
        const expected = [{ id: 'task-001', title: 'タスク' }];
        mockService.findByProject.mockResolvedValue(expected);

        const result = await controller.findByProject(mockUser as any, 'proj-001');

        expect(result).toEqual(expected);
        expect(mockService.findByProject).toHaveBeenCalledWith(
            mockUser.tenantId, 'proj-001',
        );
    });

    it('create が Service に正しい引数を渡すこと', async () => {
        const dto = { title: '新規タスク' };
        const expected = { id: 'task-new', ...dto };
        mockService.create.mockResolvedValue(expected);

        const result = await controller.create(mockUser as any, 'proj-001', dto as any);

        expect(result).toEqual(expected);
        expect(mockService.create).toHaveBeenCalledWith(
            mockUser.tenantId, 'proj-001', mockUser.id, dto,
        );
    });

    it('update が Service に正しい引数を渡すこと', async () => {
        const dto = { title: '更新タスク' };
        mockService.update.mockResolvedValue({ id: 'task-001', ...dto });

        await controller.update(mockUser as any, 'task-001', dto as any);

        expect(mockService.update).toHaveBeenCalledWith(
            mockUser.tenantId, 'task-001', dto,
        );
    });

    it('changeStatus が Service に正しい引数を渡すこと', async () => {
        const dto = { status: 'in_progress' };
        mockService.changeStatus.mockResolvedValue({ id: 'task-001', status: 'in_progress' });

        await controller.changeStatus(mockUser as any, 'task-001', dto);

        expect(mockService.changeStatus).toHaveBeenCalledWith(
            mockUser.tenantId, 'task-001', dto,
        );
    });

    it('remove が Service に正しい引数を渡すこと', async () => {
        mockService.remove.mockResolvedValue(undefined);

        await controller.remove(mockUser as any, 'task-001');

        expect(mockService.remove).toHaveBeenCalledWith(
            mockUser.tenantId, 'task-001',
        );
    });
});
