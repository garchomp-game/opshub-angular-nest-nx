import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '@prisma-db';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let prisma: any;

    const tenantId = 'tenant-001';
    const userId = 'user-001';

    const mockNotification = {
        id: 'notif-001',
        tenantId,
        userId,
        type: 'workflow_submitted',
        title: '新しい申請が届きました',
        body: '出張旅費申請 が送信されました',
        resourceType: 'workflow',
        resourceId: 'wf-001',
        isRead: false,
        createdAt: new Date('2026-02-25T09:00:00Z'),
    };

    beforeEach(async () => {
        prisma = {
            notification: {
                create: jest.fn(),
                findMany: jest.fn(),
                findFirst: jest.fn(),
                count: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
    });

    afterEach(() => jest.clearAllMocks());

    // ─── findAll ───

    describe('findAll', () => {
        it('テナント・ユーザーの通知一覧を返すこと', async () => {
            prisma.notification.findMany.mockResolvedValue([mockNotification]);
            prisma.notification.count.mockResolvedValue(1);

            const result = await service.findAll(tenantId, userId, {});

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(prisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { tenantId, userId },
                    orderBy: { createdAt: 'desc' },
                    skip: 0,
                    take: 20,
                }),
            );
        });

        it('unreadOnly=true の場合 isRead:false でフィルタすること', async () => {
            prisma.notification.findMany.mockResolvedValue([mockNotification]);
            prisma.notification.count.mockResolvedValue(1);

            await service.findAll(tenantId, userId, { unreadOnly: true });

            expect(prisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { tenantId, userId, isRead: false },
                }),
            );
        });

        it('ページネーションパラメータが正しく適用されること', async () => {
            prisma.notification.findMany.mockResolvedValue([]);
            prisma.notification.count.mockResolvedValue(0);

            await service.findAll(tenantId, userId, { page: 2, limit: 10 });

            expect(prisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 10,
                }),
            );
        });
    });

    // ─── getUnreadCount ───

    describe('getUnreadCount', () => {
        it('未読通知の件数を返すこと', async () => {
            prisma.notification.count.mockResolvedValue(5);

            const result = await service.getUnreadCount(tenantId, userId);

            expect(result).toBe(5);
            expect(prisma.notification.count).toHaveBeenCalledWith({
                where: { tenantId, userId, isRead: false },
            });
        });
    });

    // ─── markAsRead ───

    describe('markAsRead', () => {
        it('通知を既読にすること', async () => {
            prisma.notification.findFirst.mockResolvedValue(mockNotification);
            prisma.notification.update.mockResolvedValue({ ...mockNotification, isRead: true });

            await service.markAsRead(tenantId, userId, 'notif-001');

            expect(prisma.notification.update).toHaveBeenCalledWith({
                where: { id: 'notif-001' },
                data: { isRead: true },
            });
        });

        it('存在しない通知の場合 NotFoundException を投げること', async () => {
            prisma.notification.findFirst.mockResolvedValue(null);

            await expect(
                service.markAsRead(tenantId, userId, 'nonexist'),
            ).rejects.toThrow(NotFoundException);
        });

        it('他人の通知の場合 NotFoundException を投げること', async () => {
            prisma.notification.findFirst.mockResolvedValue(null); // userId が一致しないので null

            await expect(
                service.markAsRead(tenantId, 'other-user', 'notif-001'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── markAllAsRead ───

    describe('markAllAsRead', () => {
        it('未読通知をすべて既読にすること', async () => {
            prisma.notification.updateMany.mockResolvedValue({ count: 3 });

            const result = await service.markAllAsRead(tenantId, userId);

            expect(result).toEqual({ count: 3 });
            expect(prisma.notification.updateMany).toHaveBeenCalledWith({
                where: { tenantId, userId, isRead: false },
                data: { isRead: true },
            });
        });
    });

    // ─── create ───

    describe('create', () => {
        it('通知レコードを作成すること', async () => {
            prisma.notification.create.mockResolvedValue(mockNotification);

            await service.create({
                tenantId,
                userId,
                type: 'workflow_submitted',
                title: '新しい申請が届きました',
                body: '出張旅費申請 が送信されました',
                resourceType: 'workflow',
                resourceId: 'wf-001',
            });

            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    tenantId,
                    userId,
                    type: 'workflow_submitted',
                    title: '新しい申請が届きました',
                }),
            });
        });

        it('作成失敗時にエラーをスローしないこと（non-fatal）', async () => {
            prisma.notification.create.mockRejectedValue(new Error('DB error'));

            // エラーがスローされないこと
            await expect(
                service.create({
                    tenantId,
                    userId,
                    type: 'test',
                    title: 'テスト',
                }),
            ).resolves.toBeUndefined();
        });
    });

    // ─── getNotificationLink ───

    describe('getNotificationLink', () => {
        it('workflow の場合 /workflows/:id を返すこと', () => {
            const link = service.getNotificationLink('workflow', 'wf-001');
            expect(link).toBe('/workflows/wf-001');
        });

        it('project の場合 /projects/:id を返すこと', () => {
            const link = service.getNotificationLink('project', 'pj-001');
            expect(link).toBe('/projects/pj-001');
        });

        it('task の場合 /projects を返すこと', () => {
            const link = service.getNotificationLink('task', 'task-001');
            expect(link).toBe('/projects');
        });

        it('expense の場合 /expenses を返すこと', () => {
            const link = service.getNotificationLink('expense', 'exp-001');
            expect(link).toBe('/expenses');
        });

        it('null の場合 null を返すこと', () => {
            const link = service.getNotificationLink(null, null);
            expect(link).toBeNull();
        });

        it('未知のリソースタイプの場合 null を返すこと', () => {
            const link = service.getNotificationLink('unknown', 'id-001');
            expect(link).toBeNull();
        });
    });
});
