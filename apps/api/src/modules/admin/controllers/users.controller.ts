import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as ICurrentUser } from '@shared/types';
import { UsersService } from '../services/users.service';
import { InviteUserDto } from '../dto/invite-user.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';

@ApiTags('admin/users')
@ApiBearerAuth()
@Controller('admin/users')
@Roles('tenant_admin')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    async findAll(@CurrentUser() user: ICurrentUser) {
        return this.usersService.findAll(user.tenantId);
    }

    @Get(':id')
    async findOne(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
    ) {
        return this.usersService.findOne(user.tenantId, id);
    }

    @Post('invite')
    @HttpCode(HttpStatus.CREATED)
    async invite(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: InviteUserDto,
    ) {
        return this.usersService.invite(user.tenantId, dto);
    }

    @Patch(':id/role')
    async updateRole(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
        @Body() dto: UpdateUserRoleDto,
    ) {
        return this.usersService.updateRole(user.tenantId, id, dto, user.id);
    }

    @Patch(':id/status')
    async updateStatus(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
        @Body() dto: UpdateUserStatusDto,
    ) {
        return this.usersService.updateStatus(user.tenantId, id, dto.active);
    }
}
