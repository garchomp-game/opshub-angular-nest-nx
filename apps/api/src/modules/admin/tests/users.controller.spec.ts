import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';
import { Role } from '@shared/types';

describe('UsersController', () => {
    let controller: UsersController;

    const mockService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        invite: jest.fn(),
        updateRole: jest.fn(),
        updateStatus: jest.fn(),
    };

    const mockUser = {
        id: 'admin-001',
        email: 'admin@demo.com',
        displayName: '管理者',
        tenantId: 'tenant-001',
        tenantIds: ['tenant-001'],
        roles: [{ tenantId: 'tenant-001', role: Role.TENANT_ADMIN }],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                { provide: UsersService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        jest.clearAllMocks();
    });

    it('findAll が Service に委譲すること', async () => {
        const expected = [{ id: 'user-001', email: 'user@demo.com' }];
        mockService.findAll.mockResolvedValue(expected);

        const result = await controller.findAll(mockUser);

        expect(result).toEqual(expected);
        expect(mockService.findAll).toHaveBeenCalledWith('tenant-001');
    });

    it('findOne が Service に正しい引数を渡すこと', async () => {
        mockService.findOne.mockResolvedValue({ id: 'user-001' });

        await controller.findOne(mockUser, 'user-001');

        expect(mockService.findOne).toHaveBeenCalledWith('tenant-001', 'user-001');
    });

    it('invite が Service に正しい引数を渡すこと', async () => {
        const dto = { email: 'new@demo.com', role: Role.MEMBER };
        mockService.invite.mockResolvedValue({ id: 'new-user', email: 'new@demo.com' });

        await controller.invite(mockUser, dto);

        expect(mockService.invite).toHaveBeenCalledWith('tenant-001', dto);
    });

    it('updateRole が currentUserId を含めて Service に渡すこと', async () => {
        const dto = { role: Role.APPROVER };
        mockService.updateRole.mockResolvedValue({ role: 'approver' });

        await controller.updateRole(mockUser, 'user-001', dto);

        expect(mockService.updateRole).toHaveBeenCalledWith(
            'tenant-001', 'user-001', dto, 'admin-001',
        );
    });

    it('updateStatus が Service に正しい引数を渡すこと', async () => {
        mockService.updateStatus.mockResolvedValue(undefined);

        await controller.updateStatus(mockUser, 'user-001', { active: false });

        expect(mockService.updateStatus).toHaveBeenCalledWith(
            'tenant-001', 'user-001', false,
        );
    });
});
