import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
    let controller: ProjectsController;

    const mockService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        addMember: jest.fn(),
        removeMember: jest.fn(),
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
            controllers: [ProjectsController],
            providers: [
                { provide: ProjectsService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<ProjectsController>(ProjectsController);
        jest.clearAllMocks();
    });

    it('findAll が Service に委譲すること', async () => {
        const expected = { data: [{ id: 'proj-001' }], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };
        mockService.findAll.mockResolvedValue(expected);

        const result = await controller.findAll(mockUser as any, {});

        expect(result).toEqual(expected);
        expect(mockService.findAll).toHaveBeenCalledWith(
            mockUser.tenantId, mockUser.id, {},
        );
    });

    it('findOne が Service に委譲すること', async () => {
        const expected = { id: 'proj-001', name: 'PJ' };
        mockService.findOne.mockResolvedValue(expected);

        const result = await controller.findOne(mockUser as any, 'proj-001');

        expect(result).toEqual(expected);
        expect(mockService.findOne).toHaveBeenCalledWith(mockUser.tenantId, 'proj-001');
    });

    it('create が Service に正しい引数を渡すこと', async () => {
        const dto = { name: '新規PJ', pmId: 'pm-001' };
        const expected = { id: 'proj-new', ...dto };
        mockService.create.mockResolvedValue(expected);

        const result = await controller.create(mockUser as any, dto as any);

        expect(result).toEqual(expected);
        expect(mockService.create).toHaveBeenCalledWith(
            mockUser.tenantId, mockUser.id, dto,
        );
    });

    it('update が Service に正しい引数を渡すこと', async () => {
        const dto = { name: '更新PJ' };
        mockService.update.mockResolvedValue({ id: 'proj-001', ...dto });

        await controller.update(mockUser as any, 'proj-001', dto as any);

        expect(mockService.update).toHaveBeenCalledWith(
            mockUser.tenantId, 'proj-001', dto,
        );
    });

    it('addMember が Service に正しい引数を渡すこと', async () => {
        const dto = { userId: 'user-002' };
        mockService.addMember.mockResolvedValue({ id: 'member-001' });

        await controller.addMember(mockUser as any, 'proj-001', dto);

        expect(mockService.addMember).toHaveBeenCalledWith(
            mockUser.tenantId, 'proj-001', dto,
        );
    });

    it('removeMember が Service に正しい引数を渡すこと', async () => {
        mockService.removeMember.mockResolvedValue(undefined);

        await controller.removeMember(mockUser as any, 'proj-001', 'user-002');

        expect(mockService.removeMember).toHaveBeenCalledWith(
            mockUser.tenantId, 'proj-001', 'user-002',
        );
    });
});
