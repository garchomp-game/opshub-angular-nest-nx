import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUser as ICurrentUser } from '@shared/types';

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Get()
    findAll(@CurrentUser() user: ICurrentUser, @Query() query: QueryProjectDto) {
        return this.projectsService.findAll(user.tenantId, user.id, query);
    }

    @Get(':id')
    findOne(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
        return this.projectsService.findOne(user.tenantId, id);
    }

    @Post()
    @Roles('pm', 'tenant_admin')
    create(@CurrentUser() user: ICurrentUser, @Body() dto: CreateProjectDto) {
        return this.projectsService.create(user.tenantId, user.id, dto);
    }

    @Patch(':id')
    @Roles('pm', 'tenant_admin')
    update(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
        @Body() dto: UpdateProjectDto,
    ) {
        return this.projectsService.update(user.tenantId, id, dto);
    }

    @Post(':id/members')
    @Roles('pm', 'tenant_admin')
    addMember(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
        @Body() dto: AddMemberDto,
    ) {
        return this.projectsService.addMember(user.tenantId, id, dto);
    }

    @Delete(':id/members/:userId')
    @Roles('pm', 'tenant_admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    removeMember(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
        @Param('userId') userId: string,
    ) {
        return this.projectsService.removeMember(user.tenantId, id, userId);
    }
}
