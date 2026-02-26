import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsController } from '../controllers/audit-logs.controller';
import { AuditLogsService } from '../services/audit-logs.service';
import { Role } from '@shared/types';

describe('AuditLogsController', () => {
    let controller: AuditLogsController;

    const mockService = {
        findAll: jest.fn(),
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
            controllers: [AuditLogsController],
            providers: [
                { provide: AuditLogsService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<AuditLogsController>(AuditLogsController);
        jest.clearAllMocks();
    });

    it('findAll が Service にフィルタ付きで委譲すること', async () => {
        const filter = { page: 1, limit: 20, action: 'user.invite' };
        const expected = {
            data: [{ id: 'log-001', action: 'user.invite' }],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        };
        mockService.findAll.mockResolvedValue(expected);

        const result = await controller.findAll(mockUser, filter);

        expect(result).toEqual(expected);
        expect(mockService.findAll).toHaveBeenCalledWith('tenant-001', filter);
    });
});
