import { Controller, Get, Patch, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUser as ICurrentUser } from '@shared/types';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationsService) { }

    /**
     * GET /api/notifications — 通知一覧取得
     */
    @Get()
    async findAll(
        @CurrentUser() user: ICurrentUser,
        @Query() query: NotificationQueryDto,
    ) {
        return this.notificationService.findAll(user.tenantId, user.id, query);
    }

    /**
     * GET /api/notifications/unread-count — 未読件数取得
     */
    @Get('unread-count')
    async getUnreadCount(@CurrentUser() user: ICurrentUser) {
        const count = await this.notificationService.getUnreadCount(user.tenantId, user.id);
        return { count };
    }

    /**
     * PATCH /api/notifications/:id/read — 個別既読化
     */
    @Patch(':id/read')
    @HttpCode(HttpStatus.NO_CONTENT)
    async markAsRead(
        @Param('id') id: string,
        @CurrentUser() user: ICurrentUser,
    ) {
        await this.notificationService.markAsRead(user.tenantId, user.id, id);
    }

    /**
     * PATCH /api/notifications/read-all — 一括既読化
     */
    @Patch('read-all')
    @HttpCode(HttpStatus.NO_CONTENT)
    async markAllAsRead(@CurrentUser() user: ICurrentUser) {
        await this.notificationService.markAllAsRead(user.tenantId, user.id);
    }
}
