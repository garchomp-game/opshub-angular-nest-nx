import {
    Controller, Get, Post, Patch, Param, Body, Query,
    HttpCode, HttpStatus,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { QueryWorkflowDto } from './dto/query-workflow.dto';
import { RejectWorkflowDto } from './dto/reject-workflow.dto';

@Controller('workflows')
export class WorkflowsController {
    constructor(private readonly workflowsService: WorkflowsService) { }

    @Get()
    findAll(@CurrentUser() user: any, @Query() query: QueryWorkflowDto) {
        return this.workflowsService.findAll(user.tenantId, user.id, query);
    }

    @Get('pending')
    @Roles('approver', 'tenant_admin')
    findPending(@CurrentUser() user: any) {
        return this.workflowsService.findPending(user.tenantId, user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.workflowsService.findOne(user.tenantId, id);
    }

    @Post()
    @Roles('member', 'pm', 'accounting', 'approver', 'tenant_admin')
    create(@Body() dto: CreateWorkflowDto, @CurrentUser() user: any) {
        return this.workflowsService.create(user.tenantId, user.id, dto);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateWorkflowDto,
        @CurrentUser() user: any,
    ) {
        return this.workflowsService.update(user.tenantId, id, dto);
    }

    @Post(':id/submit')
    @HttpCode(HttpStatus.OK)
    submit(@Param('id') id: string, @CurrentUser() user: any) {
        return this.workflowsService.submit(user.tenantId, id, user.id);
    }

    @Post(':id/approve')
    @Roles('approver', 'tenant_admin')
    @HttpCode(HttpStatus.OK)
    approve(@Param('id') id: string, @CurrentUser() user: any) {
        return this.workflowsService.approve(user.tenantId, id, user.id);
    }

    @Post(':id/reject')
    @Roles('approver', 'tenant_admin')
    @HttpCode(HttpStatus.OK)
    reject(
        @Param('id') id: string,
        @Body() dto: RejectWorkflowDto,
        @CurrentUser() user: any,
    ) {
        return this.workflowsService.reject(user.tenantId, id, user.id, dto.reason);
    }

    @Post(':id/withdraw')
    @HttpCode(HttpStatus.OK)
    withdraw(@Param('id') id: string, @CurrentUser() user: any) {
        return this.workflowsService.withdraw(user.tenantId, id, user.id);
    }
}
