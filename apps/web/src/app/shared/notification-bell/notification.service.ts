import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, timer, switchMap, tap, catchError, of } from 'rxjs';
import { Notification, NotificationListResponse, UnreadCountResponse } from './notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
    private http = inject(HttpClient);

    // ─── State (Signal-based) ───
    private _notifications = signal<Notification[]>([]);
    private _unreadCount = signal(0);
    private _isLoading = signal(false);

    readonly notifications = this._notifications.asReadonly();
    readonly unreadCount = this._unreadCount.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();

    private pollSubscription: Subscription | null = null;
    private readonly pollInterval = 30_000; // 30秒

    ngOnDestroy(): void {
        this.stopPolling();
    }

    // ─── HTTP Methods ───

    /**
     * 通知一覧取得
     */
    getAll(query?: { page?: number; limit?: number; unreadOnly?: boolean }): Observable<NotificationListResponse> {
        const params: any = {};
        if (query?.page) params.page = query.page;
        if (query?.limit) params.limit = query.limit;
        if (query?.unreadOnly) params.unreadOnly = 'true';

        return this.http.get<NotificationListResponse>('/api/notifications', { params });
    }

    /**
     * 未読件数取得
     */
    getUnreadCount(): Observable<UnreadCountResponse> {
        return this.http.get<UnreadCountResponse>('/api/notifications/unread-count');
    }

    /**
     * 個別既読化
     */
    markAsRead(id: string): Observable<void> {
        return this.http.patch<void>(`/api/notifications/${id}/read`, {});
    }

    /**
     * 一括既読化
     */
    markAllAsRead(): Observable<void> {
        return this.http.patch<void>('/api/notifications/read-all', {});
    }

    // ─── State Management ───

    /**
     * 通知一覧を読み込み、Signalを更新
     */
    loadNotifications(): void {
        this._isLoading.set(true);
        this.getAll({ limit: 20 }).pipe(
            catchError(() => of({ data: [], total: 0 })),
        ).subscribe((res) => {
            this._notifications.set(res.data);
            this._isLoading.set(false);
        });
    }

    /**
     * 未読件数のポーリングを開始（30秒間隔）
     */
    startPolling(): void {
        if (this.pollSubscription) return; // 既にポーリング中

        this.pollSubscription = timer(0, this.pollInterval).pipe(
            switchMap(() => this.getUnreadCount()),
            catchError(() => of({ count: 0 })),
        ).subscribe((res) => {
            this._unreadCount.set(res.count);
        });
    }

    /**
     * ポーリング停止
     */
    stopPolling(): void {
        if (this.pollSubscription) {
            this.pollSubscription.unsubscribe();
            this.pollSubscription = null;
        }
    }

    /**
     * 通知を既読にしてSignalを更新
     */
    markAsReadAndUpdate(id: string): Observable<void> {
        return this.markAsRead(id).pipe(
            tap(() => {
                // ローカル状態を即時更新
                this._notifications.update((list) =>
                    list.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
                );
                this._unreadCount.update((count) => Math.max(0, count - 1));
            }),
        );
    }

    /**
     * 全て既読にしてSignalを更新
     */
    markAllAsReadAndUpdate(): void {
        this.markAllAsRead().pipe(
            catchError(() => of(undefined)),
        ).subscribe(() => {
            this._notifications.update((list) =>
                list.map((n) => ({ ...n, isRead: true })),
            );
            this._unreadCount.set(0);
        });
    }
}
