import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaHealthIndicator } from './indicators/prisma-health.indicator';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';
import { BullMQHealthIndicator } from './indicators/bullmq-health.indicator';
import { MemoryHealthIndicator } from './indicators/memory-health.indicator';
import { DiskHealthIndicator } from './indicators/disk-health.indicator';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly prismaHealth: PrismaHealthIndicator,
        private readonly redisHealth: RedisHealthIndicator,
        private readonly bullmqHealth: BullMQHealthIndicator,
        private readonly memoryHealth: MemoryHealthIndicator,
        private readonly diskHealth: DiskHealthIndicator,
    ) { }

    @Get()
    @Public()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.prismaHealth.isHealthy('database'),
            () => this.redisHealth.isHealthy('redis'),
            () => this.bullmqHealth.isHealthy('bullmq'),
            () => this.memoryHealth.isHealthy('memory'),
            () => this.diskHealth.isHealthy('disk'),
        ]);
    }
}
