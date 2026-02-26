import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaHealthIndicator } from './indicators/prisma-health.indicator';

@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly prismaHealth: PrismaHealthIndicator,
    ) { }

    @Get()
    @Public()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.prismaHealth.isHealthy('database'),
        ]);
    }
}
