import { Component, OnInit, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { DashboardService } from './dashboard.service';
import { KpiCardComponent } from './kpi-card.component';
import { AuthService } from '../../core/auth/auth.service';

interface KpiCardConfig {
  title: string;
  value: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatListModule,
    MatProgressBarModule, MatProgressSpinnerModule,
    DatePipe, KpiCardComponent,
  ],
  template: `
    <div class="dashboard-container" data-testid="dashboard-page">
      <h1 class="page-title">ダッシュボード</h1>

      @if (dashboardService.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else {
        <!-- KPI カード -->
        <section class="kpi-section" data-testid="kpi-section">
          @for (card of kpiCards(); track card.title) {
            <app-kpi-card
              [title]="card.title"
              [value]="card.value"
              [icon]="card.icon"
              [color]="card.color"
            />
          }
        </section>

        <!-- プロジェクト進捗 (PM / Tenant Admin のみ) -->
        @if (showProjectProgress()) {
          <section class="progress-section" data-testid="project-progress-section">
            <mat-card>
              <mat-card-header>
                <mat-card-title>プロジェクト進捗</mat-card-title>
                <button mat-button color="primary" (click)="navigateTo('/projects')" class="section-link">
                  一覧 →
                </button>
              </mat-card-header>
              <mat-card-content>
                @for (project of dashboardService.projectProgress(); track project.projectId) {
                  <div class="progress-item">
                    <div class="progress-header">
                      <span class="project-name">{{ project.projectName }}</span>
                      <span class="progress-percent">{{ project.progressPercent }}%</span>
                    </div>
                    <mat-progress-bar
                      mode="determinate"
                      [value]="project.progressPercent"
                      [color]="project.progressPercent >= 80 ? 'primary' : 'accent'"
                    ></mat-progress-bar>
                    <span class="progress-detail">{{ project.completedTasks }} / {{ project.totalTasks }} タスク完了</span>
                  </div>
                } @empty {
                  <p class="empty-message">進行中のプロジェクトはありません</p>
                }
              </mat-card-content>
            </mat-card>
          </section>
        }

        <!-- 通知セクション -->
        <section class="notifications-section" data-testid="notifications-section">
          <mat-card>
            <mat-card-header>
              <mat-card-title>未読通知</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (notifications().length > 0) {
                <mat-nav-list>
                  @for (notification of notifications(); track notification.id) {
                    <a mat-list-item (click)="onNotificationClick(notification)" data-testid="notification-item">
                      <mat-icon matListItemIcon>{{ getNotificationIcon(notification.type) }}</mat-icon>
                      <span matListItemTitle>{{ notification.title }}</span>
                      <span matListItemLine>{{ notification.createdAt | date:'yyyy/MM/dd HH:mm' }}</span>
                    </a>
                  }
                </mat-nav-list>
              } @else {
                <p class="empty-message">未読の通知はありません</p>
              }
            </mat-card-content>
          </mat-card>
        </section>

        <!-- クイックアクション -->
        <section class="actions-section" data-testid="quick-actions-section">
          <mat-card>
            <mat-card-header>
              <mat-card-title>クイックアクション</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="actions-grid">
                @for (action of quickActions(); track action.routerLink) {
                  <button mat-raised-button color="primary"
                    (click)="navigateTo(action.routerLink)"
                    data-testid="quick-action-btn">
                    <mat-icon>{{ action.icon }}</mat-icon>
                    {{ action.label }}
                  </button>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-title {
      font-size: 24px;
      font-weight: 500;
      margin-bottom: 24px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }
    .kpi-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .progress-section,
    .notifications-section,
    .actions-section {
      margin-bottom: 24px;
    }
    .progress-section mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-link {
      margin-left: auto;
    }
    .progress-item {
      padding: 12px 0;
    }
    .progress-item + .progress-item {
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .project-name {
      font-weight: 500;
    }
    .progress-percent {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.6);
    }
    .progress-detail {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
      margin-top: 4px;
      display: block;
    }
    .empty-message {
      color: rgba(0, 0, 0, 0.54);
      text-align: center;
      padding: 16px 0;
    }
    .actions-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .actions-grid button mat-icon {
      margin-right: 8px;
    }
  `],
})
export class DashboardComponent implements OnInit {
  readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ─── Computed signals ───

  readonly kpiCards = computed<KpiCardConfig[]>(() => {
    const data = this.dashboardService.dashboardData();
    if (!data) return [];

    const cards: KpiCardConfig[] = [];

    // 全ロール: 自分の申請
    cards.push({
      title: '自分の申請',
      value: data.kpi.myWorkflows,
      icon: 'description',
      color: '#1976d2',
    });

    // approver / tenant_admin: 未処理の申請
    if (this.authService.hasRole('approver', 'tenant_admin')) {
      cards.push({
        title: '未処理の申請',
        value: data.kpi.pendingApprovals,
        icon: 'check_circle',
        color: '#f57c00',
      });
    }

    // member / pm: 担当タスク
    if (this.authService.hasRole('member', 'pm')) {
      cards.push({
        title: '担当タスク',
        value: data.kpi.myTasks,
        icon: 'assignment',
        color: '#388e3c',
      });
    }

    // member / pm: 今週の工数
    if (this.authService.hasRole('member', 'pm')) {
      cards.push({
        title: '今週の工数',
        value: data.kpi.weeklyHours,
        icon: 'schedule',
        color: '#7b1fa2',
      });
    }

    return cards;
  });

  readonly showProjectProgress = computed(() =>
    this.authService.hasRole('pm', 'tenant_admin'),
  );

  readonly notifications = computed(() =>
    this.dashboardService.dashboardData()?.recentNotifications ?? [],
  );

  readonly quickActions = computed(() =>
    this.dashboardService.dashboardData()?.quickActions ?? [],
  );

  // ─── Lifecycle ───

  ngOnInit(): void {
    this.dashboardService.loadDashboard();
    if (this.showProjectProgress()) {
      this.dashboardService.loadProjectProgress();
    }
  }

  // ─── Actions ───

  navigateTo(path: string): void {
    this.router.navigateByUrl(path);
  }

  onNotificationClick(notification: any): void {
    const resourceMap: Record<string, string> = {
      workflow: `/workflows/${notification.resourceId}`,
      project: `/projects/${notification.resourceId}`,
      task: '/projects',
      expense: '/expenses',
    };

    const url = resourceMap[notification.resourceType];
    if (url) {
      this.router.navigateByUrl(url);
    }
  }

  getNotificationIcon(type: string): string {
    if (type?.includes('workflow')) return 'description';
    if (type?.includes('project')) return 'folder';
    if (type?.includes('task')) return 'assignment';
    if (type?.includes('expense')) return 'payments';
    return 'notifications';
  }
}
