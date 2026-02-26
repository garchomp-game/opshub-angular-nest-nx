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
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as ICurrentUser } from '@shared/types';
import { UsersService } from '../services/users.service';
import { InviteUserDto } from '../dto/invite-user.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';

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
        @Body() body: { active: boolean },
    ) {
        return this.usersService.updateStatus(user.tenantId, id, body.active);
    }
}
