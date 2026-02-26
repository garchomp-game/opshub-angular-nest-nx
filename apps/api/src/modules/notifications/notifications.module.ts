import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationsService } from './notifications.service';

@Module({
    controllers: [NotificationController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
