import { Component, OnInit, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
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
    NzCardModule, NzIconModule, NzButtonModule,
    NzSpinModule, NzProgressModule, NzEmptyModule,
    DatePipe, KpiCardComponent,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-8" data-testid="dashboard-page">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p class="text-sm text-gray-500">{{ today | date:'yyyy年M月d日 (EEEE)' }}</p>
      </header>

      @if (dashboardService.isLoading()) {
        <div class="flex flex-col items-center justify-center py-32 space-y-4">
          <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
          <span class="text-sm text-gray-500 font-medium">データを読み込み中...</span>
        </div>
      } @else {
        <!-- KPI カード -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="kpi-section">
          @for (card of kpiCards(); track card.title) {
            <app-kpi-card
              [title]="card.title"
              [value]="card.value"
              [icon]="card.icon"
              [color]="card.color"
            />
          }
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <!-- プロジェクト進捗 (PM / Tenant Admin のみ) -->
            @if (showProjectProgress()) {
              <nz-card data-testid="project-progress-section" class="dashboard-section-card" [nzTitle]="projectProgressTitle">
                <ng-template #projectProgressTitle>
                  <div class="flex justify-between items-center">
                    <h2 class="text-lg font-bold text-gray-900 flex items-center m-0">
                      <span nz-icon nzType="rise" nzTheme="outline" class="mr-2 text-primary-600"></span>
                      プロジェクト進捗
                    </h2>
                    <button nz-button nzType="link" class="!text-primary-600" (click)="navigateTo('/projects')">一覧→</button>
                  </div>
                </ng-template>
                <div class="-m-6">
                  @for (project of dashboardService.projectProgress(); track project.projectId; let last = $last) {
                    <div class="p-6 hover:bg-gray-50 transition-colors" [class.border-b]="!last" [class.border-gray-100]="!last">
                      <div class="flex justify-between items-center mb-3">
                        <span class="font-semibold text-gray-900">{{ project.projectName }}</span>
                        <span class="font-bold rounded-full px-3 py-1 text-sm inline-flex items-center" 
                              [class]="project.progressPercent >= 80 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'">
                          {{ project.progressPercent }}%
                        </span>
                      </div>
                      <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div class="h-full rounded-full transition-all duration-500 ease-out"
                             [style.width.%]="project.progressPercent"
                             [class]="project.progressPercent >= 80 ? 'bg-green-500' : 'bg-primary-500'">
                        </div>
                      </div>
                      <span class="text-xs text-gray-500 font-medium">{{ project.completedTasks }} / {{ project.totalTasks }} タスク完了</span>
                    </div>
                  } @empty {
                    <div class="py-12 flex flex-col items-center">
                      <span nz-icon nzType="inbox" nzTheme="outline" class="text-4xl text-gray-300 mb-2"></span>
                      <p class="text-gray-500">進行中のプロジェクトはありません</p>
                    </div>
                  }
                </div>
              </nz-card>
            }

            <!-- 通知セクション -->
            <nz-card data-testid="notifications-section" class="dashboard-section-card" [nzTitle]="notificationsTitle">
              <ng-template #notificationsTitle>
                <h2 class="text-lg font-bold text-gray-900 flex items-center m-0">
                  <span nz-icon nzType="bell" nzTheme="outline" class="mr-2 text-primary-600"></span>
                  未読通知
                </h2>
              </ng-template>
              <div class="-m-6">
                @if (notifications().length > 0) {
                  <div class="divide-y divide-gray-100">
                    @for (notification of notifications(); track notification.id) {
                      <div class="flex items-start p-4 hover:bg-gray-50 cursor-pointer transition-colors" (click)="onNotificationClick(notification)" (keydown.enter)="onNotificationClick(notification)" tabindex="0" role="button" data-testid="notification-item">
                        <div class="mt-1 mr-4 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 text-primary-600">
                          <span nz-icon [nzType]="getNotificationIcon(notification.type)" nzTheme="outline"></span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900 mb-1">{{ notification.title }}</p>
                          <p class="text-xs text-gray-400">{{ notification.createdAt | date:'yyyy/MM/dd HH:mm' }}</p>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="py-12 flex flex-col items-center">
                    <span nz-icon nzType="bell" nzTheme="outline" class="text-4xl text-gray-300 mb-2"></span>
                    <p class="text-gray-500">未読の通知はありません</p>
                  </div>
                }
              </div>
            </nz-card>
          </div>

          <div class="space-y-6">
            <!-- クイックアクション -->
            <nz-card data-testid="quick-actions-section" class="dashboard-section-card" [nzTitle]="quickActionsTitle">
              <ng-template #quickActionsTitle>
                <h2 class="text-lg font-bold text-gray-900 flex items-center m-0">
                  <span nz-icon nzType="thunderbolt" nzTheme="outline" class="mr-2 text-accent-500"></span>
                  クイックアクション
                </h2>
              </ng-template>
              <div class="grid grid-cols-1 gap-3">
                @for (action of quickActions(); track action.routerLink) {
                  <button class="w-full flex items-center justify-start px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all font-medium group"
                    (click)="navigateTo(action.routerLink)"
                    data-testid="quick-action-btn">
                    <span nz-icon [nzType]="getActionIcon(action.icon)" nzTheme="outline" class="mr-3 text-gray-400 group-hover:text-primary-500"></span>
                    {{ action.label }}
                  </button>
                }
              </div>
            </nz-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dashboard-section-card {
      border-radius: 12px;
      overflow: hidden;
    }
    ::ng-deep .dashboard-section-card .ant-card-head {
      background: rgba(249, 250, 251, 0.5);
      border-bottom: 1px solid #f3f4f6;
      padding: 16px 24px;
      min-height: auto;
    }
    ::ng-deep .dashboard-section-card .ant-card-body {
      padding: 24px;
    }
  `],
})
export class DashboardComponent implements OnInit {
  readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  today = new Date();

  // ─── Computed signals ───

  readonly kpiCards = computed<KpiCardConfig[]>(() => {
    const data = this.dashboardService.dashboardData();
    if (!data) return [];

    const cards: KpiCardConfig[] = [];

    // 全ロール: 自分の申請
    cards.push({
      title: '自分の申請',
      value: data.kpi.myWorkflows,
      icon: 'file-text',
      color: '#1976d2',
    });

    // approver / tenant_admin: 未処理の申請
    if (this.authService.hasRole('approver', 'tenant_admin')) {
      cards.push({
        title: '未処理の申請',
        value: data.kpi.pendingApprovals,
        icon: 'check-circle',
        color: '#f57c00',
      });
    }

    // member / pm: 担当タスク
    if (this.authService.hasRole('member', 'pm')) {
      cards.push({
        title: '担当タスク',
        value: data.kpi.myTasks,
        icon: 'solution',
        color: '#388e3c',
      });
    }

    // member / pm: 今週の工数
    if (this.authService.hasRole('member', 'pm')) {
      cards.push({
        title: '今週の工数',
        value: data.kpi.weeklyHours,
        icon: 'clock-circle',
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
    if (type?.includes('workflow')) return 'file-text';
    if (type?.includes('project')) return 'folder';
    if (type?.includes('task')) return 'solution';
    if (type?.includes('expense')) return 'dollar';
    return 'bell';
  }

  getActionIcon(materialIcon: string): string {
    const iconMap: Record<string, string> = {
      'description': 'file-text',
      'check_circle': 'check-circle',
      'assignment': 'solution',
      'schedule': 'clock-circle',
      'folder': 'folder',
      'trending_up': 'rise',
      'notifications': 'bell',
      'bolt': 'thunderbolt',
      'payments': 'dollar',
      'inbox': 'inbox',
      'add': 'plus',
      'search': 'search',
      'settings': 'setting',
      'people': 'team',
      'receipt': 'file-done',
      'attach_money': 'dollar',
    };
    return iconMap[materialIcon] || materialIcon;
  }
}
