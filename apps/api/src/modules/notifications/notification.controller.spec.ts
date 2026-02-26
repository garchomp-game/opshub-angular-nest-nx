import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationController', () => {
    let controller: NotificationController;
    let service: jest.Mocked<NotificationsService>;

    const mockUser = {
        id: 'user-001',
        email: 'test@demo.com',
        displayName: 'テスト太郎',
        tenantId: 'tenant-001',
        tenantIds: ['tenant-001'],
        roles: [{ tenantId: 'tenant-001', role: 'member' }],
    };

    const mockNotifications = [
        {
            id: 'notif-001',
            type: 'workflow_submitted',
            title: '新しい申請が届きました',
            body: null,
            resourceType: 'workflow',
            resourceId: 'wf-001',
            isRead: false,
            createdAt: new Date(),
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [NotificationController],
            providers: [
                {
                    provide: NotificationsService,
                    useValue: {
                        findAll: jest.fn().mockResolvedValue({ data: mockNotifications, total: 1 }),
                        getUnreadCount: jest.fn().mockResolvedValue(3),
                        markAsRead: jest.fn().mockResolvedValue(undefined),
                        markAllAsRead: jest.fn().mockResolvedValue({ count: 3 }),
                    },
                },
            ],
        }).compile();

        controller = module.get<NotificationController>(NotificationController);
        service = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
    });

    afterEach(() => jest.clearAllMocks());

    // ─── findAll ───

    describe('GET /notifications', () => {
        it('findAll が Service に委譲すること', async () => {
            const query = { page: 1, limit: 20 };
            const result = await controller.findAll(mockUser as any, query);

            expect(result).toEqual({ data: mockNotifications, total: 1 });
            expect(service.findAll).toHaveBeenCalledWith(
                mockUser.tenantId,
                mockUser.id,
                query,
            );
        });
    });

    // ─── getUnreadCount ───

    describe('GET /notifications/unread-count', () => {
        it('未読件数を返すこと', async () => {
            const result = await controller.getUnreadCount(mockUser as any);

            expect(result).toEqual({ count: 3 });
            expect(service.getUnreadCount).toHaveBeenCalledWith(
                mockUser.tenantId,
                mockUser.id,
            );
        });
    });

    // ─── markAsRead ───

    describe('PATCH /notifications/:id/read', () => {
        it('markAsRead が Service に正しい引数を渡すこと', async () => {
            await controller.markAsRead('notif-001', mockUser as any);

            expect(service.markAsRead).toHaveBeenCalledWith(
                mockUser.tenantId,
                mockUser.id,
                'notif-001',
            );
        });
    });

    // ─── markAllAsRead ───

    describe('PATCH /notifications/read-all', () => {
        it('markAllAsRead が Service に正しい引数を渡すこと', async () => {
            await controller.markAllAsRead(mockUser as any);

            expect(service.markAllAsRead).toHaveBeenCalledWith(
                mockUser.tenantId,
                mockUser.id,
            );
        });
    });
});
