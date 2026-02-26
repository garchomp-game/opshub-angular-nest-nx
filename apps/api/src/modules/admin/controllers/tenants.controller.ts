import { Controller, Get, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as ICurrentUser } from '@shared/types';
import { TenantsService } from '../services/tenants.service';
import { UpdateTenantDto } from '../dto/update-tenant.dto';

@Controller('admin/tenant')
@Roles('tenant_admin')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Get()
    async findOne(@CurrentUser() user: ICurrentUser) {
        return this.tenantsService.findOne(user.tenantId);
    }

    @Patch()
    async update(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: UpdateTenantDto,
    ) {
        return this.tenantsService.update(user.tenantId, dto);
    }

    @Delete()
    async softDelete(@CurrentUser() user: ICurrentUser) {
        return this.tenantsService.softDelete(user.tenantId);
    }
}
