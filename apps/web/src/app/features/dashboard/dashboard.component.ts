import { Component, OnInit, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroDocumentText, heroCheckCircle, heroBriefcase,
  heroClock, heroChartBar, heroBanknotes, heroUsers,
  heroBell, heroFolder, heroBolt, heroPlus,
  heroMagnifyingGlass, heroCog6Tooth, heroDocumentCheck,
  heroInboxArrowDown,
} from '@ng-icons/heroicons/outline';
import { DashboardService } from './dashboard.service';
import { KpiCardComponent } from './kpi-card.component';
import { AuthService } from '../../core/auth/auth.service';

interface KpiCardConfig {
  title: string;
  value: number;
  icon: string;
  color: string;
  link?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, KpiCardComponent, NgIcon],
  viewProviders: [provideIcons({
    heroDocumentText, heroCheckCircle, heroBriefcase,
    heroClock, heroChartBar, heroBanknotes, heroUsers,
    heroBell, heroFolder, heroBolt, heroPlus,
    heroMagnifyingGlass, heroCog6Tooth, heroDocumentCheck,
    heroInboxArrowDown,
  })],
  template: `
  <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-8" data-testid="dashboard-page">
   <header class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-base-content">ダッシュボード</h1>
    <p class="text-sm text-base-content/50">{{ today | date:'yyyy年M月d日 (EEEE)' }}</p>
   </header>

   @if (dashboardService.isLoading()) {
    <div class="flex flex-col items-center justify-center py-32 space-y-4" data-testid="loading-spinner">
     <span class="loading loading-spinner loading-lg text-primary"></span>
     <span class="text-sm text-base-content/50 font-medium">データを読み込み中...</span>
    </div>
   } @else {
    <!-- KPI カード -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-section">
     @for (card of kpiCards(); track card.title) {
      <app-kpi-card
       [title]="card.title"
       [value]="card.value"
       [icon]="card.icon"
       [color]="card.color"
       [link]="card.link"
      />
     }
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
     <div class="lg:col-span-2 space-y-6">
      <!-- プロジェクト進捗 (PM / Tenant Admin のみ) -->
      @if (showProjectProgress()) {
       <div class="card bg-base-100 shadow-sm border border-base-200" data-testid="project-progress-section">
        <div class="card-body">
         <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-lg">
           <ng-icon name="heroChartBar" class="text-primary text-xl" />
           プロジェクト進捗
          </h2>
          <button class="btn btn-ghost btn-sm text-primary" (click)="navigateTo('/projects')">一覧→</button>
         </div>
         @for (project of dashboardService.projectProgress(); track project.projectId; let last = $last) {
          <div class="py-4 hover:bg-base-200/30 transition-colors -mx-4 px-4"
             [class.border-b]="!last" [class.border-base-200]="!last">
           <div class="flex justify-between items-center mb-3">
            <span class="font-semibold text-base-content">{{ project.projectName }}</span>
            <span class="font-bold rounded-full px-3 py-1 text-sm inline-flex items-center"
               [class]="project.progressPercent >= 80 ? 'bg-success/10 text-success' : 'bg-info/10 text-info'">
             {{ project.progressPercent }}%
            </span>
           </div>
           <progress class="progress w-full mb-2"
                [class]="project.progressPercent >= 80 ? 'progress-success' : 'progress-primary'"
                [value]="project.progressPercent" max="100"></progress>
           <span class="text-xs text-base-content/50 font-medium">{{ project.completedTasks }} / {{ project.totalTasks }} タスク完了</span>
          </div>
         } @empty {
          <div class="py-12 flex flex-col items-center" data-testid="project-empty">
           <ng-icon name="heroInboxArrowDown" class="text-4xl text-base-content/20 mb-2" />
           <p class="text-base-content/50">進行中のプロジェクトはありません</p>
          </div>
         }
        </div>
       </div>
      }

      <!-- 通知セクション -->
      <div class="card bg-base-100 shadow-sm border border-base-200" data-testid="notifications-section">
       <div class="card-body">
        <h2 class="card-title text-lg mb-4">
         <ng-icon name="heroBell" class="text-primary text-xl" />
         未読通知
        </h2>
        @if (notifications().length > 0) {
         <div class="divide-y divide-base-200 -mx-4">
          @for (notification of notifications(); track notification.id) {
           <div class="flex items-start p-4 hover:bg-base-200/30 cursor-pointer transition-colors"
              (click)="onNotificationClick(notification)"
              (keydown.enter)="onNotificationClick(notification)"
              tabindex="0" role="button"
              data-testid="notification-item">
            <div class="mt-1 mr-4 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
             <ng-icon [name]="getNotificationIcon(notification.type)" class="text-lg" />
            </div>
            <div class="flex-1 min-w-0">
             <p class="text-sm font-medium text-base-content mb-1">{{ notification.title }}</p>
             <p class="text-xs text-base-content/40">{{ notification.createdAt | date:'yyyy/MM/dd HH:mm' }}</p>
            </div>
           </div>
          }
         </div>
        } @else {
         <div class="py-12 flex flex-col items-center" data-testid="notifications-empty">
          <ng-icon name="heroBell" class="text-4xl text-base-content/20 mb-2" />
          <p class="text-base-content/50">未読の通知はありません</p>
         </div>
        }
       </div>
      </div>
     </div>

     <div class="space-y-6">
      <!-- クイックアクション -->
      <div class="card bg-base-100 shadow-sm border border-base-200" data-testid="quick-actions-section">
       <div class="card-body">
        <h2 class="card-title text-lg mb-4">
         <ng-icon name="heroBolt" class="text-accent text-xl" />
         クイックアクション
        </h2>
        <div class="grid grid-cols-1 gap-3">
         @for (action of quickActions(); track action.routerLink) {
          <button class="btn btn-outline btn-sm justify-start gap-2 font-medium hover:btn-primary"
           (click)="navigateTo(action.routerLink)"
           data-testid="quick-action-btn">
           <ng-icon [name]="getActionIcon(action.icon)" class="text-lg" />
           {{ action.label }}
          </button>
         }
        </div>
       </div>
      </div>
     </div>
    </div>
   }
  </div>
 `,
  styles: [`
  :host { display: block; }
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
      icon: 'heroDocumentText',
      color: '#1976d2',
      link: '/workflows?mode=mine',
    });

    // approver / tenant_admin: 未処理の申請
    if (this.authService.hasRole('approver', 'tenant_admin')) {
      cards.push({
        title: '未処理の申請',
        value: data.kpi.pendingApprovals,
        icon: 'heroCheckCircle',
        color: '#f57c00',
        link: '/workflows/pending',
      });
    }

    // member / pm: 担当タスク
    if (this.authService.hasRole('member', 'pm')) {
      cards.push({
        title: '担当タスク',
        value: data.kpi.myTasks,
        icon: 'heroBriefcase',
        color: '#388e3c',
        link: '/projects',
      });
    }

    // member / pm: 今週の工数
    if (this.authService.hasRole('member', 'pm')) {
      cards.push({
        title: '今週の工数',
        value: data.kpi.weeklyHours,
        icon: 'heroClock',
        color: '#7b1fa2',
        link: '/timesheets',
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
    if (type?.includes('workflow')) return 'heroDocumentText';
    if (type?.includes('project')) return 'heroFolder';
    if (type?.includes('task')) return 'heroBriefcase';
    if (type?.includes('expense')) return 'heroBanknotes';
    return 'heroBell';
  }

  getActionIcon(materialIcon: string): string {
    const iconMap: Record<string, string> = {
      'description': 'heroDocumentText',
      'check_circle': 'heroCheckCircle',
      'assignment': 'heroBriefcase',
      'schedule': 'heroClock',
      'folder': 'heroFolder',
      'trending_up': 'heroChartBar',
      'notifications': 'heroBell',
      'bolt': 'heroBolt',
      'payments': 'heroBanknotes',
      'inbox': 'heroInboxArrowDown',
      'add': 'heroPlus',
      'search': 'heroMagnifyingGlass',
      'settings': 'heroCog6Tooth',
      'people': 'heroUsers',
      'receipt': 'heroDocumentCheck',
      'attach_money': 'heroBanknotes',
    };
    return iconMap[materialIcon] || materialIcon;
  }
}
