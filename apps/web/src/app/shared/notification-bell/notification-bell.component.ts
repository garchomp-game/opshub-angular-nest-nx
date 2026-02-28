import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { NotificationService } from './notification.service';
import { Notification } from './notification.model';
import { getNotificationLink } from '@shared/util';

@Component({
    selector: 'app-notification-bell',
    standalone: true,
    imports: [CommonModule, BadgeModule, ButtonModule, PopoverModule, ProgressSpinnerModule],
    template: `
  <p-button icon="pi pi-bell" [rounded]="true" [text]="true"
      [badge]="unreadCount() > 0 ? (unreadCount() > 99 ? '99+' : '' + unreadCount()) : undefined"
      badgeSeverity="danger"
      (onClick)="op.toggle($event); onMenuOpened()"
      data-testid="notification-bell-btn" />

  <p-popover #op [style]="{ width: '20rem' }" data-testid="notification-menu">
   <!-- Header -->
   <div class="flex items-center justify-between px-1 py-2 mb-2" style="border-bottom: 1px solid var(--p-surface-border);">
    <span class="text-base font-semibold">通知</span>
    @if (unreadCount() > 0) {
     <a (click)="onMarkAllAsRead()" class="text-sm cursor-pointer hover:underline"
       style="color: var(--p-primary-color);" data-testid="mark-all-read-btn">
      すべて既読
     </a>
    }
   </div>

   <!-- Body -->
   @if (isLoading()) {
    <div class="flex justify-center p-8" data-testid="notification-loading">
     <p-progressSpinner strokeWidth="4" [style]="{ width: '2rem', height: '2rem' }" />
    </div>
   } @else if (notifications().length === 0) {
    <div class="text-center py-8 opacity-50" data-testid="notification-empty">
     通知はありません
    </div>
   } @else {
    <div class="max-h-[400px] overflow-y-auto -mx-3">
     @for (notification of notifications(); track notification.id) {
      <div
       class="px-3 py-3 cursor-pointer transition-colors"
       [style.background-color]="!notification.isRead ? 'var(--p-primary-50)' : 'transparent'"
       style="border-bottom: 1px solid var(--p-surface-border);"
       (click)="onNotificationClick(notification)"
       [attr.data-testid]="'notification-item-' + notification.id"
      >
       <div class="flex items-start gap-3">
        <div class="flex-1 min-w-0">
         <span class="block text-sm font-medium truncate">{{ notification.title }}</span>
         @if (notification.body) {
          <span class="block text-xs opacity-60 mt-1 line-clamp-2">{{ notification.body }}</span>
         }
         <span class="block text-xs opacity-40 mt-1">
          {{ notification.createdAt | date:'M/d HH:mm' }}
         </span>
        </div>
        @if (!notification.isRead) {
         <span class="flex-shrink-0 w-2 h-2 rounded-full mt-2" style="background-color: var(--p-primary-color);"
            data-testid="unread-dot"></span>
        }
       </div>
      </div>
     }
    </div>
   }
  </p-popover>
 `,
    styles: [],
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
