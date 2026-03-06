import { Controller, Get, Post, Patch, Delete, Body, Param, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as ICurrentUser } from '@shared/types';
import { TenantsService } from '../services/tenants.service';
import { ExportService } from '../services/export.service';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { ExportTenantDto } from '../dto/export-tenant.dto';

@ApiTags('admin/tenant')
@ApiBearerAuth()
@Controller('admin/tenant')
@Roles('tenant_admin')
export class TenantsController {
    constructor(
        private readonly tenantsService: TenantsService,
        private readonly exportService: ExportService,
    ) { }

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

    // ── Export endpoints ──

    @Post('export')
    @HttpCode(HttpStatus.ACCEPTED)
    @Roles('tenant_admin', 'it_admin')
    async exportData(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: ExportTenantDto,
    ) {
        return this.exportService.requestExport(user.tenantId, user.id, dto);
    }

    @Get('export/:jobId')
    @Roles('tenant_admin', 'it_admin')
    async getExportStatus(@Param('jobId') jobId: string) {
        return this.exportService.getExportStatus(jobId);
    }

    @Get('export/:jobId/download')
    @Roles('tenant_admin', 'it_admin')
    async downloadExport(
        @Param('jobId') jobId: string,
        @Res() reply: FastifyReply,
    ) {
        const filePath = await this.exportService.getExportFile(jobId);
        const fileName = basename(filePath);
        const stream = createReadStream(filePath);
        reply
            .header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
            .header('Content-Type', 'application/octet-stream')
            .send(stream);
    }
}

