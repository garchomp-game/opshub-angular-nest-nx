import {
    Controller, Get,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    getDashboard(@CurrentUser() user: any) {
        const roles = (user.roles ?? []).map((r: any) => r.role ?? r);
        return this.dashboardService.getDashboardData(user.tenantId, user.id, roles);
    }

    @Get('kpi')
    getKpi(@CurrentUser() user: any) {
        const roles = (user.roles ?? []).map((r: any) => r.role ?? r);
        return this.dashboardService.getKpi(user.tenantId, user.id, roles);
    }

    @Get('project-progress')
    @Roles('pm', 'tenant_admin')
    getProjectProgress(@CurrentUser() user: any) {
        return this.dashboardService.getProjectProgress(user.tenantId);
    }
}
