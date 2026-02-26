import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import { getNotificationLink } from '@shared/util';
import { NotificationQueryDto } from './dto/notification-query.dto';

export interface CreateNotificationDto {
    tenantId: string;
    userId: string;
    type: string;
    title: string;
    body?: string;
    resourceType?: string;
    resourceId?: string;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * 通知レコード作成（他モジュールから呼出）
     * 補助機能のためエラーは non-fatal
     */
    async create(dto: CreateNotificationDto): Promise<void> {
        try {
            await this.prisma.notification.create({
                data: {
                    tenantId: dto.tenantId,
                    userId: dto.userId,
                    type: dto.type,
                    title: dto.title,
                    body: dto.body ?? null,
                    resourceType: dto.resourceType ?? null,
                    resourceId: dto.resourceId ?? null,
                },
            });
        } catch (error) {
            this.logger.error('Failed to create notification', error);
        }
    }

    /**
     * 通知一覧取得（新着順、ページネーション対応）
     */
    async findAll(
        tenantId: string,
        userId: string,
        query: NotificationQueryDto,
    ): Promise<{ data: any[]; total: number }> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: any = { tenantId, userId };
        if (query.unreadOnly) {
            where.isRead = false;
        }

        const [data, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where }),
        ]);

        return { data, total };
    }

    /**
     * 未読通知件数
     */
    async getUnreadCount(tenantId: string, userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: { tenantId, userId, isRead: false },
        });
    }

    /**
     * 個別既読化（本人データのみ）
     */
    async markAsRead(tenantId: string, userId: string, id: string): Promise<void> {
        const notification = await this.prisma.notification.findFirst({
            where: { id, tenantId, userId },
        });

        if (!notification) {
            throw new NotFoundException({
                code: 'ERR-SYS-002',
                message: '通知が見つかりません',
            });
        }

        await this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    /**
     * 一括既読化（本人データのみ）
     */
    async markAllAsRead(tenantId: string, userId: string): Promise<{ count: number }> {
        const result = await this.prisma.notification.updateMany({
            where: { tenantId, userId, isRead: false },
            data: { isRead: true },
        });

        return { count: result.count };
    }

    /**
     * リソースタイプからリンク先URLを生成
     */
    getNotificationLink(resourceType: string | null, resourceId: string | null): string | null {
        return getNotificationLink(resourceType, resourceId);
    }
}
