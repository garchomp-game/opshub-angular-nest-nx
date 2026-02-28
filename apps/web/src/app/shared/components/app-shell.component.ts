import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroHome,
  heroDocumentText,
  heroBriefcase,
  heroClock,
  heroBanknotes,
  heroDocumentDuplicate,
  heroMagnifyingGlass,
  heroCog6Tooth,
  heroArrowRightOnRectangle,
  heroUserCircle,
  heroBars3,
} from '@ng-icons/heroicons/outline';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '../../core/auth/auth.service';
import { HeaderSearchBarComponent } from './header-search-bar/header-search-bar.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { BreadcrumbComponent } from './breadcrumb.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    NgIcon, ToastModule, ConfirmDialogModule,
    HeaderSearchBarComponent, NotificationBellComponent,
    BreadcrumbComponent,
  ],
  viewProviders: [
    provideIcons({
      heroHome, heroDocumentText, heroBriefcase, heroClock,
      heroBanknotes, heroDocumentDuplicate, heroMagnifyingGlass,
      heroCog6Tooth, heroArrowRightOnRectangle, heroUserCircle, heroBars3,
    }),
  ],
  template: `
  <p-toast position="top-right" />
  <p-confirmdialog />
  <div class="drawer lg:drawer-open" data-testid="app-shell">
   <!-- Drawer toggle (mobile) -->
   <input id="app-drawer" type="checkbox" class="drawer-toggle" />

   <!-- Main content area -->
   <div class="drawer-content flex flex-col min-h-screen">
    <!-- Navbar / Header -->
    <div class="navbar bg-base-100 shadow-sm sticky top-0 z-10" data-testid="app-header">
     <!-- Mobile menu button -->
     <div class="flex-none lg:hidden">
      <label for="app-drawer" class="btn btn-ghost btn-square drawer-button" data-testid="menu-toggle-btn">
       <ng-icon name="heroBars3" class="text-xl" />
      </label>
     </div>

     <!-- Left: Search -->
     <div class="flex-1">
      <app-header-search-bar />
     </div>

     <!-- Right: Notifications & User -->
     <div class="flex-none flex items-center gap-2">
      <app-notification-bell />

      <div class="divider divider-horizontal mx-0 h-8"></div>

      <!-- User Dropdown -->
      <div class="dropdown dropdown-end" data-testid="user-dropdown">
       <div tabindex="0" role="button" class="btn btn-ghost gap-2">
        <div class="avatar avatar-placeholder">
         <div class="bg-primary text-primary-content w-8 rounded-full">
          <span class="text-sm">{{ auth.currentUser()?.email?.charAt(0)?.toUpperCase() || 'U' }}</span>
         </div>
        </div>
        <span class="text-sm font-medium hidden sm:inline">
         {{ auth.currentUser()?.email?.split('@')?.[0] || 'ユーザー' }}
        </span>
       </div>
       <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box shadow-lg w-56 z-20 p-2">
        <li class="menu-title">
         <span class="text-sm font-semibold">{{ auth.currentUser()?.email?.split('@')?.[0] || 'ユーザー' }}</span>
        </li>
        <li class="disabled"><a class="text-xs opacity-60">{{ auth.currentUser()?.email }}</a></li>
        <div class="divider my-0"></div>
        <li>
         <a>
          <ng-icon name="heroUserCircle" class="text-lg" />
          プロフィール設定
         </a>
        </li>
        <div class="divider my-0"></div>
        <li>
         <a class="text-error" (click)="auth.logout()" data-testid="logout-btn">
          <ng-icon name="heroArrowRightOnRectangle" class="text-lg" />
          ログアウト
         </a>
        </li>
       </ul>
      </div>
     </div>
    </div>

    <!-- Page Content -->
    <main class="p-6 flex-1" data-testid="app-content">
     <app-breadcrumb />
     <router-outlet />
    </main>

    <!-- Footer -->
    <footer class="footer footer-center bg-base-200 text-base-content p-4" data-testid="app-footer">
     <aside>
      <p>© {{ currentYear }} OpsHub Inc. All rights reserved.</p>
     </aside>
    </footer>
   </div>

   <!-- Sidebar / Drawer -->
   <div class="drawer-side z-20">
    <label for="app-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    <aside class="bg-base-200 min-h-full w-64 flex flex-col" data-testid="app-sidebar">
     <!-- Logo -->
     <div class="px-4 py-5 flex items-center gap-2">
      <ng-icon name="heroHome" class="text-primary text-2xl" />
      <span class="text-xl font-bold tracking-wide text-base-content">OpsHub</span>
     </div>

     <div class="divider my-0"></div>

     <!-- Nav Menu -->
     <ul class="menu w-full flex-1 p-4 gap-1" data-testid="sidebar-menu">
      @for (item of menuItems(); track item.path) {
       <li>
        <a [routerLink]="item.path"
          routerLinkActive="menu-active"
          [routerLinkActiveOptions]="{exact: false}"
          [attr.data-testid]="'menu-' + item.path.replace('/', '')">
         <ng-icon [name]="item.icon" class="text-lg" />
         {{ item.label }}
        </a>
       </li>
      }
     </ul>

     <div class="divider my-0"></div>

     <!-- Logout -->
     <ul class="menu w-full p-4">
      <li>
       <a class="text-error" (click)="auth.logout()" data-testid="sidebar-logout-btn">
        <ng-icon name="heroArrowRightOnRectangle" class="text-lg" />
        ログアウト
       </a>
      </li>
     </ul>
    </aside>
   </div>
  </div>
 `,
  styles: [`
  :host { display: block; }
 `],
})
export class AppShellComponent {
  auth = inject(AuthService);
  isCollapsed = false;
  currentYear = new Date().getFullYear();

  /** ロールに応じたメニュー項目（Heroicons 名に変換済み） */
  menuItems = computed(() => {
    const items = [
      { path: '/dashboard', icon: 'heroHome', label: 'ダッシュボード', roles: ['*'] },
      { path: '/workflows', icon: 'heroDocumentText', label: '申請', roles: ['*'] },
      { path: '/projects', icon: 'heroBriefcase', label: 'プロジェクト', roles: ['*'] },
      { path: '/timesheets', icon: 'heroClock', label: '工数', roles: ['member', 'pm'] },
      { path: '/expenses', icon: 'heroBanknotes', label: '経費', roles: ['*'] },
      { path: '/invoices', icon: 'heroDocumentDuplicate', label: '請求書', roles: ['accounting', 'pm', 'tenant_admin'] },
      { path: '/search', icon: 'heroMagnifyingGlass', label: '検索', roles: ['*'] },
      { path: '/admin', icon: 'heroCog6Tooth', label: '管理', roles: ['tenant_admin', 'it_admin'] },
    ];
    return items.filter((item) =>
      item.roles.includes('*') || item.roles.some((r) => this.auth.hasRole(r)),
    );
  });
}
