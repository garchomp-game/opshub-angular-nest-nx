import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '../../shared/notification-bell/notification.service';
import { Notification } from '../../shared/notification-bell/notification.model';
import { getNotificationLink } from '@shared/util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    PaginatorModule,
    ToggleButtonModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 class="text-2xl font-bold" data-testid="notifications-title">通知</h1>
        <div class="flex items-center gap-2">
          <p-toggleButton
            [(ngModel)]="unreadOnly"
            onLabel="未読のみ"
            offLabel="すべて"
            onIcon="pi pi-filter"
            offIcon="pi pi-filter-slash"
            (onChange)="onFilterChange()"
            data-testid="unread-filter-toggle"
          />
          <p-button
            label="すべて既読"
            icon="pi pi-check-circle"
            severity="secondary"
            [outlined]="true"
            (onClick)="onMarkAllAsRead()"
            [disabled]="notificationService.unreadCount() === 0"
            data-testid="mark-all-read-btn"
          />
        </div>
      </div>

      <!-- Loading -->
      @if (notificationService.isLoading()) {
        <div class="flex justify-center p-12" data-testid="notifications-loading">
          <p-progressSpinner strokeWidth="4" [style]="{ width: '3rem', height: '3rem' }" />
        </div>
      } @else if (notificationService.notifications().length === 0) {
        <!-- Empty state -->
        <div class="text-center py-16 opacity-50" data-testid="notifications-empty">
          <i class="pi pi-bell-slash text-5xl mb-4 block"></i>
          <p class="text-lg">{{ unreadOnly ? '未読の通知はありません' : '通知はありません' }}</p>
        </div>
      } @else {
        <!-- Notification List -->
        <div class="flex flex-col gap-2" data-testid="notifications-list">
          @for (notification of notificationService.notifications(); track notification.id) {
            <div
              class="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md"
              [class.border-primary-200]="!notification.isRead"
              [style.background-color]="!notification.isRead ? 'var(--p-primary-50)' : 'var(--p-surface-card)'"
              [attr.data-testid]="'notification-item-' + notification.id"
            >
              <div class="flex items-start gap-3">
                <!-- Type icon -->
                <div class="flex-shrink-0 mt-1">
                  <i [class]="getTypeIcon(notification.type)" class="text-lg" [style.color]="getTypeColor(notification.type)"></i>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0" role="button" tabindex="0" (click)="onNotificationClick(notification)" (keydown.enter)="onNotificationClick(notification)">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-base">{{ notification.title }}</span>
                    @if (!notification.isRead) {
                      <p-tag severity="info" value="未読" [rounded]="true" data-testid="unread-tag" />
                    }
                  </div>
                  @if (notification.body) {
                    <p class="text-sm opacity-70 mt-1 line-clamp-2">{{ notification.body }}</p>
                  }
                  <div class="flex items-center gap-4 mt-2 text-xs opacity-50">
                    <span><i class="pi pi-clock mr-1"></i>{{ notification.createdAt | date:'yyyy/M/d HH:mm' }}</span>
                    @if (notification.resourceType) {
                      <span><i class="pi pi-tag mr-1"></i>{{ notification.resourceType }}</span>
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex-shrink-0 flex items-center gap-1">
                  @if (!notification.isRead) {
                    <p-button
                      icon="pi pi-check"
                      [rounded]="true"
                      [text]="true"
                      severity="success"
                      pTooltip="既読にする"
                      (onClick)="onMarkAsRead(notification)"
                      [attr.data-testid]="'mark-read-btn-' + notification.id"
                    />
                  }
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    pTooltip="削除"
                    (onClick)="onDelete(notification)"
                    [attr.data-testid]="'delete-btn-' + notification.id"
                  />
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Paginator -->
        @if (total() > pageSize) {
          <div class="mt-4">
            <p-paginator
              [rows]="pageSize"
              [totalRecords]="total()"
              [first]="(currentPage() - 1) * pageSize"
              (onPageChange)="onPageChange($event)"
              data-testid="notifications-paginator"
            />
          </div>
        }
      }
    </div>
    <p-confirmDialog />
    <p-toast />
  `,
  styles: [`
    :host { display: block; }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `],
})
export class NotificationListComponent implements OnInit {
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  unreadOnly = false;
  readonly pageSize = 20;
  readonly currentPage = signal(1);
  readonly total = signal(0);

  ngOnInit(): void {
    this.loadPage();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadPage();
  }

  onPageChange(event: { first?: number; rows?: number }): void {
    const first = event.first ?? 0;
    this.currentPage.set(Math.floor(first / this.pageSize) + 1);
    this.loadPage();
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

  onMarkAsRead(notification: Notification): void {
    this.notificationService.markAsReadAndUpdate(notification.id).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: '既読にしました', life: 2000 });
    });
  }

  onMarkAllAsRead(): void {
    this.notificationService.markAllAsReadAndUpdate();
    this.messageService.add({ severity: 'success', summary: 'すべて既読にしました', life: 2000 });
  }

  onDelete(notification: Notification): void {
    this.confirmationService.confirm({
      message: 'この通知を削除しますか？',
      header: '削除確認',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '削除',
      rejectLabel: 'キャンセル',
      accept: () => {
        this.notificationService.deleteAndUpdate(notification.id).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: '通知を削除しました', life: 2000 });
          this.total.update((t) => Math.max(0, t - 1));
        });
      },
    });
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      workflow: 'pi pi-file-edit',
      project: 'pi pi-briefcase',
      task: 'pi pi-check-square',
      expense: 'pi pi-wallet',
      invoice: 'pi pi-receipt',
      system: 'pi pi-cog',
    };
    return icons[type] || 'pi pi-bell';
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      workflow: '#6366f1',
      project: '#0ea5e9',
      task: '#22c55e',
      expense: '#f59e0b',
      invoice: '#8b5cf6',
      system: '#64748b',
    };
    return colors[type] || '#6b7280';
  }

  private loadPage(): void {
    this.notificationService
      .loadNotificationsPage(this.currentPage(), this.pageSize, this.unreadOnly)
      .subscribe((res) => {
        this.total.set(res.total);
      });
  }
}
