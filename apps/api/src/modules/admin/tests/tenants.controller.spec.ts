import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from '../controllers/tenants.controller';
import { TenantsService } from '../services/tenants.service';
import { Role } from '@shared/types';

describe('TenantsController', () => {
    let controller: TenantsController;

    const mockService = {
        findOne: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
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
            controllers: [TenantsController],
            providers: [
                { provide: TenantsService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<TenantsController>(TenantsController);
        jest.clearAllMocks();
    });

    it('findOne が Service に委譲すること', async () => {
        const expected = { id: 'tenant-001', name: 'テスト' };
        mockService.findOne.mockResolvedValue(expected);

        const result = await controller.findOne(mockUser);

        expect(result).toEqual(expected);
        expect(mockService.findOne).toHaveBeenCalledWith('tenant-001');
    });

    it('update が Service に正しい引数を渡すこと', async () => {
        const dto = { name: '更新テナント' };
        mockService.update.mockResolvedValue({ ...dto, id: 'tenant-001' });

        await controller.update(mockUser, dto);

        expect(mockService.update).toHaveBeenCalledWith('tenant-001', dto);
    });

    it('softDelete が Service に委譲すること', async () => {
        mockService.softDelete.mockResolvedValue(undefined);

        await controller.softDelete(mockUser);

        expect(mockService.softDelete).toHaveBeenCalledWith('tenant-001');
    });
});
