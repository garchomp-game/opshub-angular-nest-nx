import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

describe('InvoicesController', () => {
    let controller: InvoicesController;

    const mockService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateStatus: jest.fn(),
        remove: jest.fn(),
    };

    const mockUser = {
        id: 'user-001',
        tenantId: 'tenant-001',
        roles: [{ tenantId: 'tenant-001', role: 'accounting' }],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [InvoicesController],
            providers: [
                { provide: InvoicesService, useValue: mockService },
            ],
        }).compile();

        controller = module.get<InvoicesController>(InvoicesController);
        jest.clearAllMocks();
    });

    it('findAll が Service に委譲すること', async () => {
        const expected = { data: [{ id: 'inv-001' }], meta: { total: 1 } };
        mockService.findAll.mockResolvedValue(expected);

        const result = await controller.findAll(mockUser, {});

        expect(result).toEqual(expected);
        expect(mockService.findAll).toHaveBeenCalledWith(
            mockUser.tenantId, {},
        );
    });

    it('findOne が Service に正しい引数を渡すこと', async () => {
        const expected = { id: 'inv-001', invoiceNumber: 'INV-2026-0001' };
        mockService.findOne.mockResolvedValue(expected);

        const result = await controller.findOne('inv-001', mockUser);

        expect(result).toEqual(expected);
        expect(mockService.findOne).toHaveBeenCalledWith(
            mockUser.tenantId, 'inv-001',
        );
    });

    it('create が Service に正しい引数を渡すこと', async () => {
        const dto = {
            clientName: 'テスト株式会社',
            issuedDate: '2026-02-01',
            dueDate: '2026-03-01',
            taxRate: 10,
            items: [{ description: 'サービスA', quantity: 1, unitPrice: 10000 }],
        };
        const expected = { id: 'inv-new', ...dto };
        mockService.create.mockResolvedValue(expected);

        const result = await controller.create(dto as any, mockUser);

        expect(result).toEqual(expected);
        expect(mockService.create).toHaveBeenCalledWith(
            mockUser.tenantId, mockUser.id, dto,
        );
    });

    it('update が Service に正しい引数を渡すこと', async () => {
        const dto = { clientName: '更新株式会社' };
        mockService.update.mockResolvedValue({ id: 'inv-001', ...dto });

        const result = await controller.update('inv-001', dto, mockUser);

        expect(result).toEqual({ id: 'inv-001', ...dto });
        expect(mockService.update).toHaveBeenCalledWith(
            mockUser.tenantId, 'inv-001', dto,
        );
    });

    it('updateStatus が Service に正しい引数を渡すこと', async () => {
        const dto = { status: 'sent' };
        mockService.updateStatus.mockResolvedValue({ id: 'inv-001', status: 'sent' });

        const result = await controller.updateStatus('inv-001', dto, mockUser);

        expect(result.status).toBe('sent');
        expect(mockService.updateStatus).toHaveBeenCalledWith(
            mockUser.tenantId, 'inv-001', dto,
        );
    });

    it('remove が Service に正しい引数を渡すこと', async () => {
        mockService.remove.mockResolvedValue(undefined);

        await controller.remove('inv-001', mockUser);

        expect(mockService.remove).toHaveBeenCalledWith(
            mockUser.tenantId, 'inv-001',
        );
    });
});
