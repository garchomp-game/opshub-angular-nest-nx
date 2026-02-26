import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from '../services/audit-logs.service';
import { PrismaService } from '@prisma-db';

describe('AuditLogsService', () => {
    let service: AuditLogsService;

    const mockPrisma = {
        auditLog: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    };

    const tenantId = 'tenant-001';

    const mockLogs = [
        {
            id: 'log-001',
            tenantId,
            userId: 'user-001',
            action: 'user.invite',
            resourceType: 'user',
            resourceId: 'user-002',
            beforeData: null,
            afterData: { email: 'new@demo.com' },
            metadata: {},
            createdAt: new Date('2026-02-25T10:00:00Z'),
            user: {
                email: 'admin@demo.com',
                profile: { displayName: '管理者' },
            },
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditLogsService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<AuditLogsService>(AuditLogsService);
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('ページネーション付きで監査ログを返すこと', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
            mockPrisma.auditLog.count.mockResolvedValue(1);

            const result = await service.findAll(tenantId, { page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(result.meta.page).toBe(1);
            expect(result.meta.limit).toBe(20);
            expect(result.meta.totalPages).toBe(1);
        });

        it('日付フィルタを適用できること', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue([]);
            mockPrisma.auditLog.count.mockResolvedValue(0);

            await service.findAll(tenantId, {
                dateFrom: '2026-02-01',
                dateTo: '2026-02-28',
            });

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId,
                        createdAt: {
                            gte: expect.any(Date),
                            lte: expect.any(Date),
                        },
                    }),
                }),
            );
        });

        it('アクション・リソースタイプフィルタを適用できること', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue([]);
            mockPrisma.auditLog.count.mockResolvedValue(0);

            await service.findAll(tenantId, {
                action: 'user.invite',
                resourceType: 'user',
            });

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId,
                        action: 'user.invite',
                        resourceType: 'user',
                    }),
                }),
            );
        });
    });
});
