import {
    Injectable, Logger,
    NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import { WORKFLOW_TRANSITIONS, canTransition } from '@shared/types';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { QueryWorkflowDto } from './dto/query-workflow.dto';

@Injectable()
export class WorkflowsService {
    private readonly logger = new Logger(WorkflowsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async findAll(tenantId: string, userId: string, query: QueryWorkflowDto) {
        const { status, type, mode, dateFrom, dateTo, page = 1, limit = 20 } = query;

        const where: any = { tenantId };

        if (status) where.status = status;
        if (type) where.type = type;

        if (mode === 'mine') {
            where.createdBy = userId;
        } else if (mode === 'pending') {
            where.approverId = userId;
            where.status = 'submitted';
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        const [data, total] = await Promise.all([
            this.prisma.workflow.findMany({
                where,
                include: {
                    creator: {
                        include: { profile: { select: { displayName: true } } },
                    },
                    approver: {
                        include: { profile: { select: { displayName: true } } },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.workflow.count({ where }),
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

    async findPending(tenantId: string, approverId: string) {
        return this.prisma.workflow.findMany({
            where: {
                tenantId,
                approverId,
                status: 'submitted',
            },
            include: {
                creator: {
                    include: { profile: { select: { displayName: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id },
            include: {
                creator: {
                    include: { profile: { select: { displayName: true } } },
                },
                approver: {
                    include: { profile: { select: { displayName: true } } },
                },
                attachments: true,
            },
        });

        if (!workflow || workflow.tenantId !== tenantId) {
            throw new NotFoundException({
                code: 'ERR-WF-002',
                message: '申請が見つかりません',
            });
        }

        return workflow;
    }

    async create(tenantId: string, userId: string, dto: CreateWorkflowDto) {
        const workflowNumber = await this.generateWorkflowNumber(tenantId);
        const status = dto.action === 'submit' ? 'submitted' : 'draft';

        try {
            const workflow = await this.prisma.workflow.create({
                data: {
                    tenantId,
                    workflowNumber,
                    type: dto.type as any,
                    title: dto.title,
                    description: dto.description,
                    amount: dto.amount,
                    dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
                    dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
                    approverId: dto.approverId,
                    createdBy: userId,
                    status: status as any,
                },
                include: {
                    creator: {
                        include: { profile: { select: { displayName: true } } },
                    },
                    approver: {
                        include: { profile: { select: { displayName: true } } },
                    },
                },
            });

            // 送信時は承認者に通知
            if (status === 'submitted' && dto.approverId) {
                await this.notificationsService.create({
                    tenantId,
                    userId: dto.approverId,
                    type: 'workflow.submitted',
                    title: `新しい申請: ${dto.title}`,
                    body: `${workflow.creator?.profile?.displayName ?? 'ユーザー'}から申請が届きました`,
                    resourceType: 'workflow',
                    resourceId: workflow.id,
                });
            }

            return workflow;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictException({
                    code: 'ERR-WF-001',
                    message: 'ワークフロー番号が重複しています',
                });
            }
            throw error;
        }
    }

    async update(tenantId: string, id: string, dto: UpdateWorkflowDto) {
        const workflow = await this.findOne(tenantId, id);

        if (workflow.status !== 'draft') {
            throw new ConflictException({
                code: 'ERR-WF-001',
                message: '下書き状態の申請のみ更新できます',
            });
        }

        return this.prisma.workflow.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                amount: dto.amount,
                dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
                dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
                approverId: dto.approverId,
            },
            include: {
                creator: {
                    include: { profile: { select: { displayName: true } } },
                },
                approver: {
                    include: { profile: { select: { displayName: true } } },
                },
            },
        });
    }

    async submit(tenantId: string, id: string, userId: string) {
        const workflow = await this.findOne(tenantId, id);

        if (workflow.createdBy !== userId) {
            throw new ForbiddenException({
                code: 'ERR-WF-003',
                message: '自分の申請のみ提出できます',
            });
        }

        this.validateTransition(workflow.status, 'submitted');

        const updated = await this.prisma.workflow.update({
            where: { id },
            data: { status: 'submitted' },
            include: {
                creator: {
                    include: { profile: { select: { displayName: true } } },
                },
            },
        });

        // 承認者に通知
        if (workflow.approverId) {
            await this.notificationsService.create({
                tenantId,
                userId: workflow.approverId,
                type: 'workflow.submitted',
                title: `新しい申請: ${workflow.title}`,
                body: `${updated.creator?.profile?.displayName ?? 'ユーザー'}から申請が届きました`,
                resourceType: 'workflow',
                resourceId: id,
            });
        }

        return updated;
    }

    async approve(tenantId: string, id: string, approverId: string) {
        const workflow = await this.findOne(tenantId, id);

        // 自己承認禁止
        if (workflow.createdBy === approverId) {
            throw new ForbiddenException({
                code: 'ERR-WF-003',
                message: '自分の申請は承認できません',
            });
        }

        this.validateTransition(workflow.status, 'approved');

        const updated = await this.prisma.workflow.update({
            where: { id },
            data: {
                status: 'approved',
                approvedAt: new Date(),
            },
        });

        // 申請者に通知
        await this.notificationsService.create({
            tenantId,
            userId: workflow.createdBy,
            type: 'workflow.approved',
            title: `申請が承認されました: ${workflow.title}`,
            resourceType: 'workflow',
            resourceId: id,
        });

        return updated;
    }

    async reject(tenantId: string, id: string, approverId: string, reason: string) {
        const workflow = await this.findOne(tenantId, id);

        // 自己差戻し禁止
        if (workflow.createdBy === approverId) {
            throw new ForbiddenException({
                code: 'ERR-WF-003',
                message: '自分の申請は差戻しできません',
            });
        }

        this.validateTransition(workflow.status, 'rejected');

        const updated = await this.prisma.workflow.update({
            where: { id },
            data: {
                status: 'rejected',
                rejectionReason: reason,
            },
        });

        // 申請者に通知
        await this.notificationsService.create({
            tenantId,
            userId: workflow.createdBy,
            type: 'workflow.rejected',
            title: `申請が差戻されました: ${workflow.title}`,
            body: `理由: ${reason}`,
            resourceType: 'workflow',
            resourceId: id,
        });

        return updated;
    }

    async withdraw(tenantId: string, id: string, userId: string) {
        const workflow = await this.findOne(tenantId, id);

        if (workflow.createdBy !== userId) {
            throw new ForbiddenException({
                code: 'ERR-WF-003',
                message: '自分の申請のみ取下げできます',
            });
        }

        this.validateTransition(workflow.status, 'withdrawn');

        return this.prisma.workflow.update({
            where: { id },
            data: { status: 'withdrawn' },
        });
    }

    async generateWorkflowNumber(tenantId: string): Promise<string> {
        const result = await this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.update({
                where: { id: tenantId },
                data: { workflowSeq: { increment: 1 } },
            });
            return `WF-${String(tenant.workflowSeq).padStart(3, '0')}`;
        });
        return result;
    }

    private validateTransition(currentStatus: string, targetStatus: string): void {
        if (!canTransition(WORKFLOW_TRANSITIONS as any, currentStatus as any, targetStatus as any)) {
            throw new ConflictException({
                code: 'ERR-WF-001',
                message: `状態遷移が不正です: ${currentStatus} → ${targetStatus}`,
            });
        }
    }
}
