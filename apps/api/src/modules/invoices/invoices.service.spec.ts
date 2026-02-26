import { Test, TestingModule } from '@nestjs/testing';
import {
    NotFoundException, ConflictException,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '@prisma-db';

describe('InvoicesService', () => {
    let service: InvoicesService;

    // ─── Prisma Mock ───
    const mockPrisma = {
        invoice: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        invoiceItem: {
            createMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        tenant: {
            update: jest.fn(),
        },
        $transaction: jest.fn((fn: any) => fn(mockPrisma)),
    };

    // ─── Test Data ───
    const tenantId = 'tenant-001';
    const userId = 'user-001';

    const mockInvoice = {
        id: 'inv-001',
        tenantId,
        invoiceNumber: 'INV-2026-0001',
        clientName: 'テスト株式会社',
        issuedDate: new Date('2026-02-01'),
        dueDate: new Date('2026-03-01'),
        subtotal: 100000,
        taxRate: 10,
        taxAmount: 10000,
        totalAmount: 110000,
        status: 'draft',
        notes: null,
        projectId: null,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
            {
                id: 'item-001',
                invoiceId: 'inv-001',
                description: 'サービスA',
                quantity: 2,
                unitPrice: 50000,
                amount: 100000,
                sortOrder: 0,
            },
        ],
        creator: { id: userId, profile: { displayName: 'テストユーザー' } },
        project: null,
    };

    const createDto = {
        clientName: 'テスト株式会社',
        issuedDate: '2026-02-01',
        dueDate: '2026-03-01',
        taxRate: 10,
        items: [
            { description: 'サービスA', quantity: 2, unitPrice: 50000 },
        ],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InvoicesService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<InvoicesService>(InvoicesService);
        jest.clearAllMocks();
    });

    // ─── findAll ───
    describe('findAll', () => {
        it('テナント内の請求書一覧を返すこと', async () => {
            mockPrisma.invoice.findMany.mockResolvedValue([mockInvoice]);
            mockPrisma.invoice.count.mockResolvedValue(1);

            const result = await service.findAll(tenantId, {});

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tenantId }),
                }),
            );
        });

        it('ステータスフィルタが動作すること', async () => {
            mockPrisma.invoice.findMany.mockResolvedValue([]);
            mockPrisma.invoice.count.mockResolvedValue(0);

            await service.findAll(tenantId, { status: 'draft' });

            expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tenantId, status: 'draft' }),
                }),
            );
        });

        it('ページネーションが動作すること', async () => {
            mockPrisma.invoice.findMany.mockResolvedValue([]);
            mockPrisma.invoice.count.mockResolvedValue(50);

            const result = await service.findAll(tenantId, { page: 2, limit: 10 });

            expect(result.meta.totalPages).toBe(5);
            expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 10,
                }),
            );
        });
    });

    // ─── findOne ───
    describe('findOne', () => {
        it('存在する請求書を返すこと', async () => {
            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

            const result = await service.findOne(tenantId, 'inv-001');

            expect(result).toEqual(mockInvoice);
        });

        it('存在しない場合 NotFoundException を投げること', async () => {
            mockPrisma.invoice.findUnique.mockResolvedValue(null);

            await expect(service.findOne(tenantId, 'nonexist'))
                .rejects.toThrow(NotFoundException);
        });

        it('テナントIDが異なる場合 NotFoundException を投げること', async () => {
            mockPrisma.invoice.findUnique.mockResolvedValue({
                ...mockInvoice,
                tenantId: 'other-tenant',
            });

            await expect(service.findOne(tenantId, 'inv-001'))
                .rejects.toThrow(NotFoundException);
        });
    });

    // ─── create ───
    describe('create', () => {
        it('請求書を作成し金額を計算すること', async () => {
            mockPrisma.tenant.update.mockResolvedValue({ invoiceSeq: 1 });
            mockPrisma.invoice.create.mockResolvedValue({ ...mockInvoice, id: 'inv-new' });
            mockPrisma.invoiceItem.createMany.mockResolvedValue({ count: 1 });
            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

            const result = await service.create(tenantId, userId, createDto as any);

            expect(result).toEqual(mockInvoice);
            expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        tenantId,
                        subtotal: 100000,
                        taxAmount: 10000,
                        totalAmount: 110000,
                    }),
                }),
            );
        });
    });

    // ─── update ───
    describe('update', () => {
        it('下書き状態の請求書を更新できること', async () => {
            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.invoice.update.mockResolvedValue(mockInvoice);
            mockPrisma.invoiceItem.deleteMany.mockResolvedValue({ count: 1 });
            mockPrisma.invoiceItem.createMany.mockResolvedValue({ count: 1 });

            const result = await service.update(tenantId, 'inv-001', {
                clientName: '更新株式会社',
                items: [{ description: 'サービスB', quantity: 3, unitPrice: 30000 }],
            });

            expect(result).toEqual(mockInvoice);
        });

        it('下書き以外の請求書は更新できないこと', async () => {
            mockPrisma.invoice.findUnique.mockResolvedValue({
                ...mockInvoice,
                status: 'sent',
            });

            await expect(
                service.update(tenantId, 'inv-001', { clientName: '更新' }),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ─── updateStatus ───
    describe('updateStatus', () => {
        it('draft → sent に状態遷移すること', async () => {
            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.invoice.update.mockResolvedValue({
                ...mockInvoice,
                status: 'sent',
            });

            const result = await service.updateStatus(tenantId, 'inv-001', { status: 'sent' });

            expect(result.status).toBe('sent');
        });

        it('sent → paid に状態遷移すること', async () => {
            mockPrisma.invoice.findUnique.mockResolvedValue({
                ...mockInvoice,
                status: 'sent',
            });
            mockPrisma.invoice.update.mockResolvedValue({
                ...mockInvoice,
                status: 'paid',
            });

            const result = await service.updateStatus(tenantId, 'inv-001', { status: 'paid' });

            expect(result.status).toBe('paid');
        });

        it('draft → paid は ConflictException を投げること', async () => {
            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

            await expect(
                service.updateStatus(tenantId, 'inv-001', { status: 'paid' }),
            ).rejects.toThrow(ConflictException);
        });

        it('paid → sent は ConflictException を投げること', async () => {
            mockPrisma.invoice.findUnique.mockResolvedValue({
                ...mockInvoice,
                status: 'paid',
            });

            await expect(
                service.updateStatus(tenantId, 'inv-001', { status: 'sent' }),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ─── remove ───
    describe('remove', () => {
        it('下書き状態の請求書を削除できること', async () => {
            mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
            mockPrisma.invoice.delete.mockResolvedValue(mockInvoice);

            await expect(service.remove(tenantId, 'inv-001')).resolves.not.toThrow();
            expect(mockPrisma.invoice.delete).toHaveBeenCalledWith({
                where: { id: 'inv-001' },
            });
        });

        it('下書き以外の請求書は削除できないこと', async () => {
            mockPrisma.invoice.findUnique.mockResolvedValue({
                ...mockInvoice,
                status: 'sent',
            });

            await expect(service.remove(tenantId, 'inv-001'))
                .rejects.toThrow(ConflictException);
        });
    });

    // ─── generateInvoiceNumber ───
    describe('generateInvoiceNumber', () => {
        it('INV-YYYY-NNNN 形式の番号を生成すること', async () => {
            mockPrisma.tenant.update.mockResolvedValue({ invoiceSeq: 42 });

            const result = await service.generateInvoiceNumber(tenantId);

            const year = new Date().getFullYear();
            expect(result).toBe(`INV-${year}-0042`);
        });
    });
});
