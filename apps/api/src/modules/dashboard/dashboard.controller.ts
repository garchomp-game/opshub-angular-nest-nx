import {
    Controller, Get, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CacheTTL } from '@nestjs/cache-manager';
import { TenantCacheInterceptor } from '../../common/interceptors/tenant-cache.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    @UseInterceptors(TenantCacheInterceptor)
    @CacheTTL(30_000)
    getDashboard(@CurrentUser() user: any) {
        const roles = (user.roles ?? []).map((r: any) => r.role ?? r);
        return this.dashboardService.getDashboardData(user.tenantId, user.id, roles);
    }

    @Get('kpi')
    @UseInterceptors(TenantCacheInterceptor)
    @CacheTTL(30_000)
    getKpi(@CurrentUser() user: any) {
        const roles = (user.roles ?? []).map((r: any) => r.role ?? r);
        return this.dashboardService.getKpi(user.tenantId, user.id, roles);
    }

    @Get('project-progress')
    @Roles('pm', 'tenant_admin')
    @UseInterceptors(TenantCacheInterceptor)
    @CacheTTL(30_000)
    getProjectProgress(@CurrentUser() user: any) {
        return this.dashboardService.getProjectProgress(user.tenantId);
    }
}
