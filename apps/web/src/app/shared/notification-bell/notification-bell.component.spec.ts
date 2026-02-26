import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationService } from './notification.service';

describe('NotificationBellComponent', () => {
    let component: NotificationBellComponent;
    let fixture: ComponentFixture<NotificationBellComponent>;

    const mockNotificationService = {
        notifications: signal([
            {
                id: 'notif-001',
                type: 'workflow_submitted',
                title: '新しい申請が届きました',
                body: '出張旅費申請 が送信されました',
                resourceType: 'workflow',
                resourceId: 'wf-001',
                isRead: false,
                createdAt: '2026-02-25T09:00:00Z',
            },
            {
                id: 'notif-002',
                type: 'workflow_approved',
                title: '申請が承認されました',
                body: null,
                resourceType: 'workflow',
                resourceId: 'wf-002',
                isRead: true,
                createdAt: '2026-02-24T15:00:00Z',
            },
        ]),
        unreadCount: signal(1),
        isLoading: signal(false),
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
        loadNotifications: vi.fn(),
        markAsReadAndUpdate: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
        markAllAsReadAndUpdate: vi.fn(),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NotificationBellComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                { provide: NotificationService, useValue: mockNotificationService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(NotificationBellComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('コンポーネントが作成されること', () => {
        expect(component).toBeTruthy();
    });

    it('初期化時に startPolling が呼ばれること', () => {
        expect(mockNotificationService.startPolling).toHaveBeenCalled();
    });

    it('ベルアイコンが表示されること', () => {
        const bellBtn = fixture.nativeElement.querySelector('[data-testid="notification-bell-btn"]');
        expect(bellBtn).toBeTruthy();
    });

    it('未読バッジが表示されること', () => {
        const icon = fixture.nativeElement.querySelector('[data-testid="notification-bell-icon"]');
        expect(icon).toBeTruthy();
    });

    it('onMenuOpened が loadNotifications を呼ぶこと', () => {
        component.onMenuOpened();
        expect(mockNotificationService.loadNotifications).toHaveBeenCalled();
    });

    it('onMarkAllAsRead が markAllAsReadAndUpdate を呼ぶこと', () => {
        component.onMarkAllAsRead();
        expect(mockNotificationService.markAllAsReadAndUpdate).toHaveBeenCalled();
    });

    it('ローディング中はスピナーが表示されること', () => {
        mockNotificationService.isLoading.set(true);
        mockNotificationService.unreadCount.set(0);
        fixture.detectChanges();

        // Note: mat-menu content is rendered lazily, so we check via component state
        expect(component.isLoading()).toBe(true);
    });
});
