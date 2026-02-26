import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TenantsService } from '../services/tenants.service';
import { PrismaService } from '@prisma-db';

describe('TenantsService', () => {
    let service: TenantsService;

    const mockPrisma = {
        tenant: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    const tenantId = 'tenant-001';
    const mockTenant = {
        id: tenantId,
        name: 'テストテナント',
        slug: 'test-tenant',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TenantsService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<TenantsService>(TenantsService);
        jest.clearAllMocks();
    });

    describe('findOne', () => {
        it('テナントを返すこと', async () => {
            mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

            const result = await service.findOne(tenantId);

            expect(result).toEqual(mockTenant);
            expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
                where: { id: tenantId },
            });
        });

        it('存在しない場合 NotFoundException を投げること', async () => {
            mockPrisma.tenant.findUnique.mockResolvedValue(null);

            await expect(service.findOne('nonexist'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('テナント設定を更新して返すこと', async () => {
            const updatedTenant = { ...mockTenant, name: '更新テナント' };
            mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
            mockPrisma.tenant.update.mockResolvedValue(updatedTenant);

            const result = await service.update(tenantId, { name: '更新テナント' });

            expect(result.name).toBe('更新テナント');
            expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
                where: { id: tenantId },
                data: { name: '更新テナント' },
            });
        });
    });

    describe('softDelete', () => {
        it('deletedAt を設定すること', async () => {
            mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
            mockPrisma.tenant.update.mockResolvedValue({ ...mockTenant, deletedAt: new Date() });

            await service.softDelete(tenantId);

            expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
                where: { id: tenantId },
                data: { deletedAt: expect.any(Date) },
            });
        });
    });
});
