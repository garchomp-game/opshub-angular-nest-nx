import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from '../controllers/tenants.controller';
import { TenantsService } from '../services/tenants.service';
import { ExportService } from '../services/export.service';
import { Role } from '@shared/types';

describe('TenantsController', () => {
    let controller: TenantsController;

    const mockTenantsService = {
        findOne: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
    };

    const mockExportService = {
        requestExport: jest.fn(),
        getExportStatus: jest.fn(),
        getExportFile: jest.fn(),
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
                { provide: TenantsService, useValue: mockTenantsService },
                { provide: ExportService, useValue: mockExportService },
            ],
        }).compile();

        controller = module.get<TenantsController>(TenantsController);
        jest.clearAllMocks();
    });

    it('findOne が Service に委譲すること', async () => {
        const expected = { id: 'tenant-001', name: 'テスト' };
        mockTenantsService.findOne.mockResolvedValue(expected);

        const result = await controller.findOne(mockUser);

        expect(result).toEqual(expected);
        expect(mockTenantsService.findOne).toHaveBeenCalledWith('tenant-001');
    });

    it('update が Service に正しい引数を渡すこと', async () => {
        const dto = { name: '更新テナント' };
        mockTenantsService.update.mockResolvedValue({ ...dto, id: 'tenant-001' });

        await controller.update(mockUser, dto);

        expect(mockTenantsService.update).toHaveBeenCalledWith('tenant-001', dto);
    });

    it('softDelete が Service に委譲すること', async () => {
        mockTenantsService.softDelete.mockResolvedValue(undefined);

        await controller.softDelete(mockUser);

        expect(mockTenantsService.softDelete).toHaveBeenCalledWith('tenant-001');
    });

    // ── Export tests ──

    describe('exportData', () => {
        it('ExportService.requestExport に正しい引数を渡すこと', async () => {
            const dto = { format: 'json', include: ['users', 'projects'] } as any;
            mockExportService.requestExport.mockResolvedValue({ jobId: 'job-001', status: 'queued' });

            const result = await controller.exportData(mockUser, dto);

            expect(result).toEqual({ jobId: 'job-001', status: 'queued' });
            expect(mockExportService.requestExport).toHaveBeenCalledWith('tenant-001', 'admin-001', dto);
        });
    });

    describe('getExportStatus', () => {
        it('ExportService.getExportStatus に jobId を渡すこと', async () => {
            const expected = { jobId: 'job-001', status: 'completed', progress: 100 };
            mockExportService.getExportStatus.mockResolvedValue(expected);

            const result = await controller.getExportStatus('job-001');

            expect(result).toEqual(expected);
            expect(mockExportService.getExportStatus).toHaveBeenCalledWith('job-001');
        });
    });

    describe('downloadExport', () => {
        it('ExportService.getExportFile を呼び reply でファイルを返すこと', async () => {
            mockExportService.getExportFile.mockResolvedValue('/exports/t/export.json');
            const mockReply = {
                header: jest.fn().mockReturnThis(),
                send: jest.fn(),
            } as any;

            await controller.downloadExport('job-001', mockReply);

            expect(mockExportService.getExportFile).toHaveBeenCalledWith('job-001');
            expect(mockReply.header).toHaveBeenCalledWith(
                'Content-Disposition',
                expect.stringContaining('export.json'),
            );
            expect(mockReply.send).toHaveBeenCalled();
        });
    });
});
