import {
    Injectable, Logger,
    NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import { INVOICE_TRANSITIONS, canTransition } from '@shared/types';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';

@Injectable()
export class InvoicesService {
    private readonly logger = new Logger(InvoicesService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── findAll ───
    async findAll(tenantId: string, query: QueryInvoiceDto) {
        const { status, clientName, projectId, page = 1, limit = 20 } = query;

        const where: any = { tenantId };
        if (status) where.status = status;
        if (projectId) where.projectId = projectId;
        if (clientName) {
            where.clientName = { contains: clientName, mode: 'insensitive' };
        }

        const [data, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                include: {
                    project: { select: { id: true, name: true } },
                    creator: {
                        include: { profile: { select: { displayName: true } } },
                    },
                    _count: { select: { items: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.invoice.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ─── findOne ───
    async findOne(tenantId: string, id: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: {
                project: { select: { id: true, name: true } },
                creator: {
                    include: { profile: { select: { displayName: true } } },
                },
                items: { orderBy: { sortOrder: 'asc' } },
            },
        });

        if (!invoice || invoice.tenantId !== tenantId) {
            throw new NotFoundException({
                code: 'ERR-INV-001',
                message: '請求書が見つかりません',
            });
        }

        return invoice;
    }

    // ─── create ───
    async create(tenantId: string, userId: string, dto: CreateInvoiceDto) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Auto-numbering
            const invoiceNumber = await this.generateInvoiceNumber(tenantId, tx);

            // 2. Calculate amounts
            const subtotal = dto.items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0,
            );
            const taxAmount = Math.floor(subtotal * dto.taxRate / 100);
            const totalAmount = subtotal + taxAmount;

            // 3. Create invoice header
            const invoice = await tx.invoice.create({
                data: {
                    tenantId,
                    invoiceNumber,
                    projectId: dto.projectId,
                    clientName: dto.clientName,
                    issuedDate: new Date(dto.issuedDate),
                    dueDate: new Date(dto.dueDate),
                    subtotal,
                    taxRate: dto.taxRate,
                    taxAmount,
                    totalAmount,
                    status: 'draft' as any,
                    notes: dto.notes,
                    createdBy: userId,
                },
            });

            // 4. Create items
            await tx.invoiceItem.createMany({
                data: dto.items.map((item, index) => ({
                    tenantId,
                    invoiceId: invoice.id,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    amount: item.quantity * item.unitPrice,
                    sortOrder: item.sortOrder ?? index,
                })),
            });

            // 5. Return with items
            return tx.invoice.findUnique({
                where: { id: invoice.id },
                include: {
                    project: { select: { id: true, name: true } },
                    creator: {
                        include: { profile: { select: { displayName: true } } },
                    },
                    items: { orderBy: { sortOrder: 'asc' } },
                },
            });
        });
    }

    // ─── update ───
    async update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
        const invoice = await this.findOne(tenantId, id);

        if (invoice.status !== 'draft') {
            throw new ConflictException({
                code: 'ERR-INV-002',
                message: '下書き状態の請求書のみ更新できます',
            });
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Update header
            const headerData: any = {};
            if (dto.projectId !== undefined) headerData.projectId = dto.projectId;
            if (dto.clientName !== undefined) headerData.clientName = dto.clientName;
            if (dto.issuedDate !== undefined) headerData.issuedDate = new Date(dto.issuedDate);
            if (dto.dueDate !== undefined) headerData.dueDate = new Date(dto.dueDate);
            if (dto.taxRate !== undefined) headerData.taxRate = dto.taxRate;
            if (dto.notes !== undefined) headerData.notes = dto.notes;

            if (Object.keys(headerData).length > 0) {
                await tx.invoice.update({ where: { id }, data: headerData });
            }

            // 2. If items provided, delete all + re-insert
            if (dto.items && dto.items.length > 0) {
                await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

                await tx.invoiceItem.createMany({
                    data: dto.items.map((item, index) => ({
                        tenantId,
                        invoiceId: id,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.quantity * item.unitPrice,
                        sortOrder: item.sortOrder ?? index,
                    })),
                });

                // 3. Recalculate amounts
                const taxRate = dto.taxRate ?? Number(invoice.taxRate);
                const subtotal = dto.items.reduce(
                    (sum, item) => sum + item.quantity * item.unitPrice,
                    0,
                );
                const taxAmount = Math.floor(subtotal * taxRate / 100);
                await tx.invoice.update({
                    where: { id },
                    data: { subtotal, taxAmount, totalAmount: subtotal + taxAmount },
                });
            }

            // 4. Return updated
            return tx.invoice.findUnique({
                where: { id },
                include: {
                    project: { select: { id: true, name: true } },
                    creator: {
                        include: { profile: { select: { displayName: true } } },
                    },
                    items: { orderBy: { sortOrder: 'asc' } },
                },
            });
        });
    }

    // ─── updateStatus ───
    async updateStatus(tenantId: string, id: string, dto: UpdateInvoiceStatusDto) {
        const invoice = await this.findOne(tenantId, id);

        this.validateTransition(invoice.status, dto.status);

        return this.prisma.invoice.update({
            where: { id },
            data: { status: dto.status as any },
            include: {
                project: { select: { id: true, name: true } },
                creator: {
                    include: { profile: { select: { displayName: true } } },
                },
                items: { orderBy: { sortOrder: 'asc' } },
            },
        });
    }

    // ─── remove ───
    async remove(tenantId: string, id: string) {
        const invoice = await this.findOne(tenantId, id);

        if (invoice.status !== 'draft') {
            throw new ConflictException({
                code: 'ERR-INV-003',
                message: '下書き状態の請求書のみ削除できます',
            });
        }

        await this.prisma.invoice.delete({ where: { id } });
    }

    // ─── generateInvoiceNumber ───
    async generateInvoiceNumber(tenantId: string, tx?: any): Promise<string> {
        const prisma = tx ?? this.prisma;
        const runInTx = async (client: any) => {
            const tenant = await client.tenant.update({
                where: { id: tenantId },
                data: { invoiceSeq: { increment: 1 } },
            });
            const year = new Date().getFullYear();
            return `INV-${year}-${String(tenant.invoiceSeq).padStart(4, '0')}`;
        };

        if (tx) {
            return runInTx(tx);
        }
        return this.prisma.$transaction(async (txClient) => runInTx(txClient));
    }

    // ─── validateTransition ───
    private validateTransition(currentStatus: string, targetStatus: string): void {
        if (!canTransition(INVOICE_TRANSITIONS as any, currentStatus as any, targetStatus as any)) {
            throw new ConflictException({
                code: 'ERR-INV-004',
                message: `状態遷移が不正です: ${currentStatus} → ${targetStatus}`,
            });
        }
    }
}
