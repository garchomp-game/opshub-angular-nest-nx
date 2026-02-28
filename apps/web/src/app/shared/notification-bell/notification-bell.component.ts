import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroBell } from '@ng-icons/heroicons/outline';
import { NotificationService } from './notification.service';
import { Notification } from './notification.model';
import { getNotificationLink } from '@shared/util';

@Component({
 selector: 'app-notification-bell',
 standalone: true,
 imports: [CommonModule, NgIcon],
 viewProviders: [provideIcons({ heroBell })],
 template: `
  <details class="dropdown dropdown-end" #dropdownEl
       (toggle)="dropdownEl.open && onMenuOpened()"
       data-testid="notification-dropdown">
   <summary class="btn btn-ghost btn-circle indicator" data-testid="notification-bell-btn">
    <ng-icon name="heroBell" class="text-xl" />
    @if (unreadCount() > 0) {
     <span class="badge badge-primary badge-xs indicator-item" data-testid="unread-badge">
      {{ unreadCount() > 99 ? '99+' : unreadCount() }}
     </span>
    }
   </summary>

   <div class="dropdown-content bg-base-100 rounded-box shadow-lg w-80 z-30" data-testid="notification-menu">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-base-300">
     <span class="text-base font-semibold">通知</span>
     @if (unreadCount() > 0) {
      <a (click)="onMarkAllAsRead()" class="text-sm text-primary cursor-pointer hover:underline" data-testid="mark-all-read-btn">
       すべて既読
      </a>
     }
    </div>

    <!-- Body -->
    @if (isLoading()) {
     <div class="flex justify-center p-8" data-testid="notification-loading">
      <span class="loading loading-spinner loading-md"></span>
     </div>
    } @else if (notifications().length === 0) {
     <div class="text-center py-8 text-base-content/50" data-testid="notification-empty">
      通知はありません
     </div>
    } @else {
     <div class="max-h-[400px] overflow-y-auto">
      @for (notification of notifications(); track notification.id) {
       <div
        class="px-4 py-3 cursor-pointer hover:bg-base-200 transition-colors border-b border-base-200 last:border-b-0"
        [class.bg-info/10]="!notification.isRead"
        (click)="onNotificationClick(notification)"
        [attr.data-testid]="'notification-item-' + notification.id"
       >
        <div class="flex items-start gap-3">
         <div class="flex-1 min-w-0">
          <span class="block text-sm font-medium truncate">{{ notification.title }}</span>
          @if (notification.body) {
           <span class="block text-xs text-base-content/60 mt-1 line-clamp-2">{{ notification.body }}</span>
          }
          <span class="block text-xs text-base-content/40 mt-1">
           {{ notification.createdAt | date:'M/d HH:mm' }}
          </span>
         </div>
         @if (!notification.isRead) {
          <span class="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" data-testid="unread-dot"></span>
         }
        </div>
       </div>
      }
     </div>
    }
   </div>
  </details>
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
