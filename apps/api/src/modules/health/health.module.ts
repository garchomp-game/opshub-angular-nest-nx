import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './indicators/prisma-health.indicator';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';
import { BullMQHealthIndicator } from './indicators/bullmq-health.indicator';
import { MemoryHealthIndicator } from './indicators/memory-health.indicator';
import { DiskHealthIndicator } from './indicators/disk-health.indicator';

@Module({
    imports: [
        TerminusModule,
        BullModule.registerQueue({ name: 'mail' }),
    ],
    controllers: [HealthController],
    providers: [
        PrismaHealthIndicator,
        RedisHealthIndicator,
        BullMQHealthIndicator,
        MemoryHealthIndicator,
        DiskHealthIndicator,
    ],
})
export class HealthModule { }
