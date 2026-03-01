import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { NotificationListComponent } from './notification-list.component';
import { NotificationService } from '../../shared/notification-bell/notification.service';

describe('NotificationListComponent', () => {
    let component: NotificationListComponent;
    let fixture: ComponentFixture<NotificationListComponent>;
    let confirmationService: ConfirmationService;

    const mockNotifications = [
        {
            id: 'notif-001',
            type: 'workflow',
            title: '新しい申請が届きました',
            body: '出張旅費申請',
            resourceType: 'workflow',
            resourceId: 'wf-001',
            isRead: false,
            createdAt: '2026-02-25T09:00:00Z',
        },
        {
            id: 'notif-002',
            type: 'project',
            title: 'プロジェクトが更新されました',
            body: null,
            resourceType: 'project',
            resourceId: 'pj-001',
            isRead: true,
            createdAt: '2026-02-24T10:00:00Z',
        },
    ];

    const mockNotificationService = {
        notifications: signal(mockNotifications),
        unreadCount: signal(1),
        isLoading: signal(false),
        loadNotificationsPage: vi.fn().mockReturnValue(of({ data: mockNotifications, total: 2 })),
        markAsReadAndUpdate: vi.fn().mockReturnValue(of(undefined)),
        markAllAsReadAndUpdate: vi.fn(),
        deleteAndUpdate: vi.fn().mockReturnValue(of(undefined)),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NotificationListComponent],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                provideHttpClient(),
                ConfirmationService,
                MessageService,
                { provide: NotificationService, useValue: mockNotificationService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(NotificationListComponent);
        component = fixture.componentInstance;
        confirmationService = fixture.debugElement.injector.get(ConfirmationService);
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.clearAllMocks();
        // Reset signals to default
        mockNotificationService.notifications.set(mockNotifications);
        mockNotificationService.unreadCount.set(1);
        mockNotificationService.isLoading.set(false);
    });

    // ─── 初期描画 ───

    it('コンポーネントが作成されること', () => {
        expect(component).toBeTruthy();
    });

    it('タイトルが表示されること', () => {
        const title = fixture.nativeElement.querySelector('[data-testid="notifications-title"]');
        expect(title).toBeTruthy();
        expect(title.textContent).toContain('通知');
    });

    it('初期化時に loadNotificationsPage が呼ばれること', () => {
        expect(mockNotificationService.loadNotificationsPage).toHaveBeenCalledWith(1, 20, false);
    });

    // ─── 通知一覧表示 ───

    it('通知一覧が表示されること', () => {
        const list = fixture.nativeElement.querySelector('[data-testid="notifications-list"]');
        expect(list).toBeTruthy();
    });

    it('通知アイテムが正しい数だけ表示されること', () => {
        const items = fixture.nativeElement.querySelectorAll('[data-testid^="notification-item-"]');
        expect(items.length).toBe(2);
    });

    it('未読通知に未読タグが表示されること', () => {
        const tags = fixture.nativeElement.querySelectorAll('[data-testid="unread-tag"]');
        expect(tags.length).toBe(1);
    });

    // ─── ローディング ───

    it('ローディング中はスピナーが表示されること', () => {
        mockNotificationService.isLoading.set(true);
        mockNotificationService.notifications.set([]);
        fixture.detectChanges();

        const spinner = fixture.nativeElement.querySelector('[data-testid="notifications-loading"]');
        expect(spinner).toBeTruthy();
    });

    // ─── 空状態 ───

    it('データなし時は空状態メッセージが表示されること', () => {
        mockNotificationService.notifications.set([]);
        mockNotificationService.isLoading.set(false);
        fixture.detectChanges();

        const empty = fixture.nativeElement.querySelector('[data-testid="notifications-empty"]');
        expect(empty).toBeTruthy();
        expect(empty.textContent).toContain('通知はありません');
    });

    it('未読フィルターON時の空状態メッセージが正しいこと', () => {
        component.unreadOnly = true;
        mockNotificationService.notifications.set([]);
        mockNotificationService.isLoading.set(false);
        fixture.detectChanges();

        const empty = fixture.nativeElement.querySelector('[data-testid="notifications-empty"]');
        expect(empty).toBeTruthy();
        expect(empty.textContent).toContain('未読の通知はありません');
    });

    // ─── フィルター切り替え ───

    it('フィルタートグルが表示されること', () => {
        const toggle = fixture.nativeElement.querySelector('[data-testid="unread-filter-toggle"]');
        expect(toggle).toBeTruthy();
    });

    it('onFilterChange でページが1にリセットされて再読み込みされること', () => {
        component.currentPage.set(3);
        mockNotificationService.loadNotificationsPage.mockClear();

        component.onFilterChange();

        expect(component.currentPage()).toBe(1);
        expect(mockNotificationService.loadNotificationsPage).toHaveBeenCalled();
    });

    // ─── すべて既読 ───

    it('すべて既読ボタンが表示されること', () => {
        const btn = fixture.nativeElement.querySelector('[data-testid="mark-all-read-btn"]');
        expect(btn).toBeTruthy();
    });

    it('onMarkAllAsRead で markAllAsReadAndUpdate が呼ばれること', () => {
        component.onMarkAllAsRead();
        expect(mockNotificationService.markAllAsReadAndUpdate).toHaveBeenCalled();
    });

    it('未読がない場合すべて既読ボタンがdisabledになること', () => {
        mockNotificationService.unreadCount.set(0);
        fixture.detectChanges();

        const host = fixture.nativeElement.querySelector('[data-testid="mark-all-read-btn"]');
        const innerBtn = host.querySelector('button') || host;
        expect(innerBtn.disabled).toBe(true);
    });

    // ─── 個別既読 ───

    it('未読通知に既読ボタンが表示されること', () => {
        const btn = fixture.nativeElement.querySelector('[data-testid="mark-read-btn-notif-001"]');
        expect(btn).toBeTruthy();
    });

    it('onMarkAsRead で markAsReadAndUpdate が呼ばれること', () => {
        component.onMarkAsRead(mockNotifications[0] as any);
        expect(mockNotificationService.markAsReadAndUpdate).toHaveBeenCalledWith('notif-001');
    });

    // ─── 削除 ───

    it('削除ボタンが各通知に表示されること', () => {
        const btns = fixture.nativeElement.querySelectorAll('[data-testid^="delete-btn-"]');
        expect(btns.length).toBe(2);
    });

    it('onDelete で確認ダイアログが呼ばれること', () => {
        const confirmSpy = vi.spyOn(confirmationService, 'confirm');
        component.onDelete(mockNotifications[0] as any);
        expect(confirmSpy).toHaveBeenCalled();
    });

    it('削除確認後に deleteAndUpdate が呼ばれること', () => {
        vi.spyOn(confirmationService, 'confirm').mockImplementation((opts: any) => {
            opts.accept();
            return confirmationService;
        });

        component.onDelete(mockNotifications[0] as any);
        expect(mockNotificationService.deleteAndUpdate).toHaveBeenCalledWith('notif-001');
    });

    // ─── ページネーション ───

    it('onPageChange でページが更新されること', () => {
        mockNotificationService.loadNotificationsPage.mockClear();

        component.onPageChange({ first: 20 });

        expect(component.currentPage()).toBe(2);
        expect(mockNotificationService.loadNotificationsPage).toHaveBeenCalled();
    });

    // ─── ヘルパーメソッド ───

    it('getTypeIcon が正しいアイコンを返すこと', () => {
        expect(component.getTypeIcon('workflow')).toBe('pi pi-file-edit');
        expect(component.getTypeIcon('project')).toBe('pi pi-briefcase');
        expect(component.getTypeIcon('unknown')).toBe('pi pi-bell');
    });

    it('getTypeColor が正しい色を返すこと', () => {
        expect(component.getTypeColor('workflow')).toBe('#6366f1');
        expect(component.getTypeColor('project')).toBe('#0ea5e9');
        expect(component.getTypeColor('unknown')).toBe('#6b7280');
    });
});
