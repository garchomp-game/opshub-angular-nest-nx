import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import { UpdateTenantDto } from '../dto/update-tenant.dto';

@Injectable()
export class TenantsService {
    private readonly logger = new Logger(TenantsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async findOne(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            throw new NotFoundException({
                code: 'ERR-ADM-001',
                message: 'テナントが見つかりません',
            });
        }

        return tenant;
    }

    async update(tenantId: string, dto: UpdateTenantDto) {
        await this.findOne(tenantId);

        const tenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.settings !== undefined && { settings: dto.settings }),
            },
        });

        this.logger.log(`Tenant updated: ${tenantId}`);
        return tenant;
    }

    async softDelete(tenantId: string) {
        await this.findOne(tenantId);

        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { deletedAt: new Date() },
        });

        this.logger.log(`Tenant soft-deleted: ${tenantId}`);
    }
}
