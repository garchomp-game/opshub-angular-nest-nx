import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

@Module({
    imports: [NotificationsModule],
    controllers: [WorkflowsController],
    providers: [WorkflowsService],
    exports: [WorkflowsService],
})
export class WorkflowsModule { }
