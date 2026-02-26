import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import { AuditLogFilterDto } from '../dto/audit-log-filter.dto';
import { PaginatedResult } from '@shared/types';

@Injectable()
export class AuditLogsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(
        tenantId: string,
        filter: AuditLogFilterDto,
    ): Promise<PaginatedResult<any>> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: any = { tenantId };

        if (filter.action) {
            where.action = filter.action;
        }

        if (filter.resourceType) {
            where.resourceType = filter.resourceType;
        }

        if (filter.userId) {
            where.userId = filter.userId;
        }

        if (filter.dateFrom || filter.dateTo) {
            where.createdAt = {};
            if (filter.dateFrom) {
                where.createdAt.gte = new Date(filter.dateFrom);
            }
            if (filter.dateTo) {
                where.createdAt.lte = new Date(filter.dateTo);
            }
        }

        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        include: {
                            profile: { select: { displayName: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            data: data.map((log: any) => ({
                id: log.id,
                action: log.action,
                resourceType: log.resourceType,
                resourceId: log.resourceId,
                userId: log.userId,
                userName: log.user?.profile?.displayName ?? log.user?.email ?? '',
                beforeData: log.beforeData,
                afterData: log.afterData,
                metadata: log.metadata,
                createdAt: log.createdAt,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
