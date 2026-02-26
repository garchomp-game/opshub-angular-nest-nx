import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NotificationService } from './notification.service';
import { Notification } from './notification.model';
import { getNotificationLink } from '@shared/util';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule, NzBadgeModule, NzDropDownModule,
    NzButtonModule, NzSpinModule, NzEmptyModule, NzDividerModule,
  ],
  template: `
    <nz-badge [nzCount]="unreadCount()" [nzOverflowCount]="99" nzSize="small">
      <a nz-dropdown [nzDropdownMenu]="notifMenu" nzTrigger="click"
         (nzVisibleChange)="$event && onMenuOpened()"
         data-testid="notification-bell-btn"
         class="text-gray-500 hover:text-gray-700 text-xl leading-none">
        <span nz-icon nzType="bell" nzTheme="outline"></span>
      </a>
    </nz-badge>

    <nz-dropdown-menu #notifMenu="nzDropdownMenu">
      <div class="bg-white rounded-lg shadow-lg w-[360px]" data-testid="notification-menu">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b">
          <span class="text-base font-semibold text-gray-900">通知</span>
          @if (unreadCount() > 0) {
            <a (click)="onMarkAllAsRead()" class="text-sm text-blue-500 cursor-pointer" data-testid="mark-all-read-btn">
              すべて既読
            </a>
          }
        </div>

        <!-- Body -->
        @if (isLoading()) {
          <div class="flex justify-center p-8" data-testid="notification-loading">
            <nz-spin nzSimple></nz-spin>
          </div>
        } @else if (notifications().length === 0) {
          <div class="py-8" data-testid="notification-empty">
            <nz-empty nzNotFoundContent="通知はありません"></nz-empty>
          </div>
        } @else {
          <div class="max-h-[400px] overflow-y-auto">
            @for (notification of notifications(); track notification.id) {
              <div
                class="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                [class.bg-blue-50]="!notification.isRead"
                (click)="onNotificationClick(notification)"
                [attr.data-testid]="'notification-item-' + notification.id"
              >
                <div class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm font-medium text-gray-900 truncate">{{ notification.title }}</span>
                    @if (notification.body) {
                      <span class="block text-xs text-gray-500 mt-1 line-clamp-2">{{ notification.body }}</span>
                    }
                    <span class="block text-xs text-gray-400 mt-1">
                      {{ notification.createdAt | date:'M/d HH:mm' }}
                    </span>
                  </div>
                  @if (!notification.isRead) {
                    <span class="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" data-testid="unread-dot"></span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </nz-dropdown-menu>
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
