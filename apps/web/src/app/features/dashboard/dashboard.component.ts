import { Component, OnInit, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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
  imports: [DatePipe, KpiCardComponent, CardModule, ButtonModule, ProgressBarModule, ProgressSpinnerModule],
  template: `
  <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-8" data-testid="dashboard-page">
   <header class="flex items-center justify-between">
    <h1 class="text-2xl font-bold m-0">ダッシュボード</h1>
    <p class="text-sm opacity-50 m-0">{{ today | date:'yyyy年M月d日 (EEEE)' }}</p>
   </header>

   @if (dashboardService.isLoading()) {
    <div class="flex flex-col items-center justify-center py-32 gap-4" data-testid="loading-spinner">
     <p-progressSpinner strokeWidth="4" />
     <span class="text-sm opacity-50 font-medium">データを読み込み中...</span>
    </div>
   } @else {
    <!-- KPI カード -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-section">
     @for (card of kpiCards(); track card.title) {
      <app-kpi-card
       [title]="card.title" [value]="card.value" [icon]="card.icon"
       [color]="card.color" [link]="card.link" />
     }
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
     <div class="lg:col-span-2 space-y-6">
      <!-- プロジェクト進捗 -->
      @if (showProjectProgress()) {
       <p-card data-testid="project-progress-section">
        <div class="flex justify-between items-center mb-4">
         <h2 class="text-lg font-semibold m-0 flex items-center gap-2">
          <i class="pi pi-chart-bar text-xl" style="color: var(--p-primary-color);"></i>
          プロジェクト進捗
         </h2>
         <p-button label="一覧→" [text]="true" size="small" (onClick)="navigateTo('/projects')" />
        </div>
        @for (project of dashboardService.projectProgress(); track project.projectId; let last = $last) {
         <div class="py-4" [class.border-b]="!last" [style.border-color]="'var(--p-surface-border)'">
          <div class="flex justify-between items-center mb-3">
           <span class="font-semibold">{{ project.projectName }}</span>
           <span class="font-bold rounded-full px-3 py-1 text-sm"
              [style.background-color]="project.progressPercent >= 80 ? 'var(--p-green-100)' : 'var(--p-blue-100)'"
              [style.color]="project.progressPercent >= 80 ? 'var(--p-green-600)' : 'var(--p-blue-600)'">
            {{ project.progressPercent }}%
           </span>
          </div>
          <p-progressbar [value]="project.progressPercent" [showValue]="false"
              [style]="{ height: '8px' }"
              [color]="project.progressPercent >= 80 ? 'var(--p-green-500)' : 'var(--p-primary-color)'" />
          <span class="text-xs opacity-50 font-medium mt-2 block">{{ project.completedTasks }} / {{ project.totalTasks }} タスク完了</span>
         </div>
        } @empty {
         <div class="py-12 flex flex-col items-center" data-testid="project-empty">
          <i class="pi pi-inbox text-4xl opacity-20 mb-2"></i>
          <p class="opacity-50">進行中のプロジェクトはありません</p>
         </div>
        }
       </p-card>
      }

      <!-- 通知セクション -->
      <p-card data-testid="notifications-section">
       <h2 class="text-lg font-semibold m-0 mb-4 flex items-center gap-2">
        <i class="pi pi-bell text-xl" style="color: var(--p-primary-color);"></i>
        未読通知
       </h2>
       @if (notifications().length > 0) {
        <div class="divide-y" style="--tw-divide-opacity: 1; border-color: var(--p-surface-border);">
         @for (notification of notifications(); track notification.id) {
          <div class="flex items-start p-4 -mx-4 hover:bg-black/5 cursor-pointer transition-colors"
             (click)="onNotificationClick(notification)"
             (keydown.enter)="onNotificationClick(notification)"
             tabindex="0" role="button"
             data-testid="notification-item">
           <div class="mt-1 mr-4 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style="background-color: var(--p-primary-100); color: var(--p-primary-color);">
            <i [class]="getNotificationIcon(notification.type)" class="text-lg"></i>
           </div>
           <div class="flex-1 min-w-0">
            <p class="text-sm font-medium mb-1">{{ notification.title }}</p>
            <p class="text-xs opacity-40">{{ notification.createdAt | date:'yyyy/MM/dd HH:mm' }}</p>
           </div>
          </div>
         }
        </div>
       } @else {
        <div class="py-12 flex flex-col items-center" data-testid="notifications-empty">
         <i class="pi pi-bell text-4xl opacity-20 mb-2"></i>
         <p class="opacity-50">未読の通知はありません</p>
        </div>
       }
      </p-card>
     </div>

     <div class="space-y-6">
      <!-- クイックアクション -->
      <p-card data-testid="quick-actions-section">
       <h2 class="text-lg font-semibold m-0 mb-4 flex items-center gap-2">
        <i class="pi pi-bolt text-xl" style="color: var(--p-yellow-500);"></i>
        クイックアクション
       </h2>
       <div class="grid grid-cols-1 gap-3">
        @for (action of quickActions(); track action.routerLink) {
         <p-button [label]="action.label" [icon]="getActionIcon(action.icon)"
             [outlined]="true" severity="secondary" size="small"
             styleClass="w-full justify-start"
             (onClick)="navigateTo(action.routerLink)"
             data-testid="quick-action-btn" />
        }
       </div>
      </p-card>
     </div>
    </div>
   }
  </div>
 `,
  styles: [`:host { display: block; }`],
})
export class DashboardComponent implements OnInit {
  readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  today = new Date();

  readonly kpiCards = computed<KpiCardConfig[]>(() => {
    const data = this.dashboardService.dashboardData();
    if (!data) return [];

    const cards: KpiCardConfig[] = [];

    cards.push({
      title: '自分の申請',
      value: data.kpi.myWorkflows,
      icon: 'heroDocumentText',
      color: '#1976d2',
      link: '/workflows?mode=mine',
    });

    if (this.authService.hasRole('approver', 'tenant_admin')) {
      cards.push({
        title: '未処理の申請',
        value: data.kpi.pendingApprovals,
        icon: 'heroCheckCircle',
        color: '#f57c00',
        link: '/workflows/pending',
      });
    }

    if (this.authService.hasRole('member', 'pm')) {
      cards.push({
        title: '担当タスク',
        value: data.kpi.myTasks,
        icon: 'heroBriefcase',
        color: '#388e3c',
        link: '/projects',
      });
    }

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

  ngOnInit(): void {
    this.dashboardService.loadDashboard();
    if (this.showProjectProgress()) {
      this.dashboardService.loadProjectProgress();
    }
  }

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
    if (type?.includes('workflow')) return 'pi pi-file';
    if (type?.includes('project')) return 'pi pi-folder';
    if (type?.includes('task')) return 'pi pi-briefcase';
    if (type?.includes('expense')) return 'pi pi-money-bill';
    return 'pi pi-bell';
  }

  getActionIcon(materialIcon: string): string {
    const iconMap: Record<string, string> = {
      'description': 'pi pi-file',
      'check_circle': 'pi pi-check-circle',
      'assignment': 'pi pi-briefcase',
      'schedule': 'pi pi-clock',
      'folder': 'pi pi-folder',
      'trending_up': 'pi pi-chart-bar',
      'notifications': 'pi pi-bell',
      'bolt': 'pi pi-bolt',
      'payments': 'pi pi-money-bill',
      'inbox': 'pi pi-inbox',
      'add': 'pi pi-plus',
      'search': 'pi pi-search',
      'settings': 'pi pi-cog',
      'people': 'pi pi-users',
      'receipt': 'pi pi-file-check',
      'attach_money': 'pi pi-money-bill',
    };
    return iconMap[materialIcon] || 'pi pi-star';
  }
}
