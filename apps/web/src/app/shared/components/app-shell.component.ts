import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/auth/auth.service';
import { HeaderSearchBarComponent } from './header-search-bar/header-search-bar.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { BreadcrumbComponent } from './breadcrumb.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    ToastModule, ConfirmDialogModule, ButtonModule, DrawerModule, AvatarModule, MenuModule,
    HeaderSearchBarComponent, NotificationBellComponent,
    BreadcrumbComponent,
  ],
  template: `
  <p-toast position="top-right" />
  <p-confirmdialog />

  <div class="flex min-h-screen" data-testid="app-shell">
   <!-- Desktop Sidebar -->
   <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0"
       style="background-color: var(--p-surface-100); border-right: 1px solid var(--p-surface-border);"
       data-testid="app-sidebar">
    <!-- Logo -->
    <div class="px-5 py-5 flex items-center gap-3">
     <i class="pi pi-th-large text-2xl" style="color: var(--p-primary-color);"></i>
     <span class="text-xl font-bold tracking-wide">OpsHub</span>
    </div>

    <div style="border-bottom: 1px solid var(--p-surface-border);"></div>

    <!-- Nav Menu -->
    <nav class="flex-1 p-3 space-y-1" data-testid="sidebar-menu">
     @for (item of menuItems(); track item.path) {
      <a [routerLink]="item.path"
        routerLinkActive="active-link"
        [routerLinkActiveOptions]="{exact: false}"
        class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-black/5"
        [attr.data-testid]="'menu-' + item.path.replace('/', '')">
       <i [class]="item.icon" class="text-lg"></i>
       {{ item.label }}
      </a>
     }
    </nav>

    <div style="border-bottom: 1px solid var(--p-surface-border);"></div>

    <!-- Logout -->
    <div class="p-3">
     <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-red-50"
       style="color: var(--p-red-500);"
       (click)="auth.logout()" data-testid="sidebar-logout-btn">
      <i class="pi pi-sign-out text-lg"></i>
      ログアウト
     </a>
    </div>
   </aside>

   <!-- Mobile Drawer -->
   <p-drawer [(visible)]="mobileMenuOpen" [modal]="true" [showCloseIcon]="true" position="left" styleClass="w-64">
    <ng-template #header>
     <div class="flex items-center gap-2">
      <i class="pi pi-th-large text-xl" style="color: var(--p-primary-color);"></i>
      <span class="text-lg font-bold">OpsHub</span>
     </div>
    </ng-template>
    <nav class="space-y-1">
     @for (item of menuItems(); track item.path) {
      <a [routerLink]="item.path"
        routerLinkActive="active-link"
        [routerLinkActiveOptions]="{exact: false}"
        class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-black/5"
        (click)="mobileMenuOpen = false">
       <i [class]="item.icon" class="text-lg"></i>
       {{ item.label }}
      </a>
     }
    </nav>
    <div class="mt-auto pt-4" style="border-top: 1px solid var(--p-surface-border);">
     <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-red-50"
       style="color: var(--p-red-500);"
       (click)="auth.logout()">
      <i class="pi pi-sign-out text-lg"></i>
      ログアウト
     </a>
    </div>
   </p-drawer>

   <!-- Main content area -->
   <div class="flex flex-col flex-1 lg:ml-64 min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-10 flex items-center h-16 px-4 gap-4"
        style="background-color: var(--p-surface-card); border-bottom: 1px solid var(--p-surface-border);"
        data-testid="app-header">
     <!-- Mobile menu button -->
     <p-button icon="pi pi-bars" [rounded]="true" [text]="true"
         styleClass="lg:hidden" (onClick)="mobileMenuOpen = true"
         data-testid="menu-toggle-btn" />

     <!-- Search -->
     <div class="flex-1">
      <app-header-search-bar />
     </div>

     <!-- Right: Notifications & User -->
     <div class="flex items-center gap-2">
      <app-notification-bell />

      <div class="h-8 mx-1" style="border-left: 1px solid var(--p-surface-border);"></div>

      <!-- User menu -->
      <div class="flex items-center gap-2 cursor-pointer" (click)="userMenu.toggle($event)" data-testid="user-dropdown">
       <p-avatar [label]="auth.currentUser()?.email?.charAt(0)?.toUpperCase() || 'U'"
           shape="circle" size="normal"
           [style]="{ 'background-color': 'var(--p-primary-color)', 'color': 'white' }" />
       <span class="text-sm font-medium hidden sm:inline">
        {{ auth.currentUser()?.email?.split('@')?.[0] || 'ユーザー' }}
       </span>
      </div>
      <p-menu #userMenu [model]="userMenuItems" [popup]="true" />
     </div>
    </header>

    <!-- Page Content -->
    <main class="p-6 flex-1" data-testid="app-content">
     <app-breadcrumb />
     <router-outlet />
    </main>

    <!-- Footer -->
    <footer class="text-center py-4 text-sm opacity-50"
        style="border-top: 1px solid var(--p-surface-border);"
        data-testid="app-footer">
     © {{ currentYear }} OpsHub Inc. All rights reserved.
    </footer>
   </div>
  </div>
 `,
  styles: [`
  :host { display: block; }
  .active-link {
    background-color: var(--p-primary-50);
    color: var(--p-primary-color);
  }
 `],
})
export class AppShellComponent {
  auth = inject(AuthService);
  mobileMenuOpen = false;
  currentYear = new Date().getFullYear();

  userMenuItems: MenuItem[] = [
    {
      label: 'プロフィール設定',
      icon: 'pi pi-user',
    },
    { separator: true },
    {
      label: 'ログアウト',
      icon: 'pi pi-sign-out',
      styleClass: 'text-red-500',
      command: () => this.auth.logout(),
    },
  ];

  menuItems = computed(() => {
    const items = [
      { path: '/dashboard', icon: 'pi pi-home', label: 'ダッシュボード', roles: ['*'] },
      { path: '/workflows', icon: 'pi pi-file', label: '申請', roles: ['*'] },
      { path: '/projects', icon: 'pi pi-briefcase', label: 'プロジェクト', roles: ['*'] },
      { path: '/timesheets', icon: 'pi pi-clock', label: '工数', roles: ['member', 'pm'] },
      { path: '/expenses', icon: 'pi pi-money-bill', label: '経費', roles: ['*'] },
      { path: '/invoices', icon: 'pi pi-copy', label: '請求書', roles: ['accounting', 'pm', 'tenant_admin'] },
      { path: '/search', icon: 'pi pi-search', label: '検索', roles: ['*'] },
      { path: '/admin', icon: 'pi pi-cog', label: '管理', roles: ['tenant_admin', 'it_admin'] },
    ];
    return items.filter((item) =>
      item.roles.includes('*') || item.roles.some((r) => this.auth.hasRole(r)),
    );
  });
}
