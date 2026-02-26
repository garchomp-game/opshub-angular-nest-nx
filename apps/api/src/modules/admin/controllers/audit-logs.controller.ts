import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as ICurrentUser } from '@shared/types';
import { AuditLogsService } from '../services/audit-logs.service';
import { AuditLogFilterDto } from '../dto/audit-log-filter.dto';

@Controller('admin/audit-logs')
@Roles('tenant_admin')
export class AuditLogsController {
    constructor(private readonly auditLogsService: AuditLogsService) { }

    @Get()
    async findAll(
        @CurrentUser() user: ICurrentUser,
        @Query() filter: AuditLogFilterDto,
    ) {
        return this.auditLogsService.findAll(user.tenantId, filter);
    }
}
