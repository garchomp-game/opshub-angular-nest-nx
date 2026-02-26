import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { HealthController } from '../health.controller';
import { PrismaHealthIndicator } from '../indicators/prisma-health.indicator';

describe('HealthController', () => {
    let controller: HealthController;
    let healthCheckService: jest.Mocked<HealthCheckService>;

    const mockHealthyResult: HealthCheckResult = {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                {
                    provide: HealthCheckService,
                    useValue: {
                        check: jest.fn().mockResolvedValue(mockHealthyResult),
                    },
                },
                {
                    provide: PrismaHealthIndicator,
                    useValue: {
                        isHealthy: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
                    },
                },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        healthCheckService = module.get(HealthCheckService) as jest.Mocked<HealthCheckService>;
    });

    afterEach(() => jest.clearAllMocks());

    describe('GET /health', () => {
        it('should return healthy status when DB is up', async () => {
            const result = await controller.check();

            expect(healthCheckService.check).toHaveBeenCalledWith([
                expect.any(Function),
            ]);
            expect(result).toEqual(mockHealthyResult);
        });

        it('should call health check with database indicator', async () => {
            await controller.check();

            // Verify the check function was called with an array of indicator functions
            const checkArg = healthCheckService.check.mock.calls[0][0];
            expect(checkArg).toHaveLength(1);
            expect(typeof checkArg[0]).toBe('function');
        });
    });
});
