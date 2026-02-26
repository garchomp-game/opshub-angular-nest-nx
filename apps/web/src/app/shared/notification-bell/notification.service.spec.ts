import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
    let service: NotificationService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                NotificationService,
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });
        service = TestBed.inject(NotificationService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        service.stopPolling();
    });

    // ─── Initial State ───

    it('初期状態では未読数が 0 であること', () => {
        expect(service.unreadCount()).toBe(0);
        expect(service.notifications().length).toBe(0);
        expect(service.isLoading()).toBe(false);
    });

    // ─── getAll ───

    describe('getAll', () => {
        it('GET /api/notifications を呼ぶこと', () => {
            const mockData = {
                data: [{ id: 'notif-001', title: 'テスト通知', isRead: false }],
                total: 1,
            };

            service.getAll().subscribe((res) => {
                expect(res.data).toHaveLength(1);
                expect(res.total).toBe(1);
            });

            const req = httpMock.expectOne('/api/notifications');
            expect(req.request.method).toBe('GET');
            req.flush(mockData);
        });

        it('クエリパラメータを渡せること', () => {
            service.getAll({ page: 2, limit: 10, unreadOnly: true }).subscribe();

            const req = httpMock.expectOne(
                (r) => r.url === '/api/notifications' &&
                    r.params.get('page') === '2' &&
                    r.params.get('limit') === '10' &&
                    r.params.get('unreadOnly') === 'true',
            );
            expect(req.request.method).toBe('GET');
            req.flush({ data: [], total: 0 });
        });
    });

    // ─── getUnreadCount ───

    describe('getUnreadCount', () => {
        it('GET /api/notifications/unread-count を呼ぶこと', () => {
            service.getUnreadCount().subscribe((res) => {
                expect(res.count).toBe(5);
            });

            const req = httpMock.expectOne('/api/notifications/unread-count');
            expect(req.request.method).toBe('GET');
            req.flush({ count: 5 });
        });
    });

    // ─── markAsRead ───

    describe('markAsRead', () => {
        it('PATCH /api/notifications/:id/read を呼ぶこと', () => {
            service.markAsRead('notif-001').subscribe();

            const req = httpMock.expectOne('/api/notifications/notif-001/read');
            expect(req.request.method).toBe('PATCH');
            req.flush(null);
        });
    });

    // ─── markAllAsRead ───

    describe('markAllAsRead', () => {
        it('PATCH /api/notifications/read-all を呼ぶこと', () => {
            service.markAllAsRead().subscribe();

            const req = httpMock.expectOne('/api/notifications/read-all');
            expect(req.request.method).toBe('PATCH');
            req.flush(null);
        });
    });

    // ─── エラーハンドリング ───

    describe('error handling', () => {
        it('getAll エラー時にエラーレスポンスを返すこと', () => {
            service.getAll().subscribe({
                error: (err) => expect(err.status).toBe(500),
            });

            const req = httpMock.expectOne('/api/notifications');
            req.flush(
                { success: false, error: { code: 'ERR-SYS-001', message: 'Server error' } },
                { status: 500, statusText: 'Internal Server Error' },
            );
        });
    });
});
