import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from './notification.service';
import { Notification } from './notification.model';
import { getNotificationLink } from '@shared/util';

@Component({
    selector: 'app-notification-bell',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatBadgeModule,
        MatMenuModule,
        MatDividerModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './notification-bell.component.html',
    styleUrl: './notification-bell.component.css',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
    private notificationService = inject(NotificationService);
    private router = inject(Router);

    readonly notifications = this.notificationService.notifications;
    readonly unreadCount = this.notificationService.unreadCount;
    readonly isLoading = this.notificationService.isLoading;

    ngOnInit(): void {
        this.notificationService.startPolling();
    }

    ngOnDestroy(): void {
        this.notificationService.stopPolling();
    }

    onMenuOpened(): void {
        this.notificationService.loadNotifications();
    }

    onNotificationClick(notification: Notification): void {
        if (!notification.isRead) {
            this.notificationService.markAsReadAndUpdate(notification.id).subscribe();
        }

        const link = getNotificationLink(notification.resourceType, notification.resourceId);
        if (link) {
            this.router.navigate([link]);
        }
    }

    onMarkAllAsRead(): void {
        this.notificationService.markAllAsReadAndUpdate();
    }
}
