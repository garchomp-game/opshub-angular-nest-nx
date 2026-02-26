import {
    Controller, Get, Post, Put, Patch, Delete,
    Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, ChangeTaskStatusDto } from './dto/update-task.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUser as ICurrentUser } from '@shared/types';

@Controller()
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Get('projects/:projectId/tasks')
    findByProject(
        @CurrentUser() user: ICurrentUser,
        @Param('projectId') projectId: string,
    ) {
        return this.tasksService.findByProject(user.tenantId, projectId);
    }

    @Post('projects/:projectId/tasks')
    create(
        @CurrentUser() user: ICurrentUser,
        @Param('projectId') projectId: string,
        @Body() dto: CreateTaskDto,
    ) {
        return this.tasksService.create(user.tenantId, projectId, user.id, dto);
    }

    @Put('tasks/:id')
    update(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
        @Body() dto: UpdateTaskDto,
    ) {
        return this.tasksService.update(user.tenantId, id, dto);
    }

    @Patch('tasks/:id/status')
    changeStatus(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
        @Body() dto: ChangeTaskStatusDto,
    ) {
        return this.tasksService.changeStatus(user.tenantId, id, dto);
    }

    @Delete('tasks/:id')
    @Roles('pm')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
    ) {
        return this.tasksService.remove(user.tenantId, id);
    }
}
