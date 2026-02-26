import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { AuthService } from '../../core/auth/auth.service';
import { HeaderSearchBarComponent } from './header-search-bar/header-search-bar.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    NzLayoutModule, NzMenuModule, NzIconModule,
    NzAvatarModule, NzDropDownModule, NzBadgeModule, NzBreadCrumbModule,
    HeaderSearchBarComponent, NotificationBellComponent,
  ],
  template: `
    <nz-layout class="min-h-screen">
      <!-- Sidebar -->
      <nz-sider
        nzCollapsible
        [(nzCollapsed)]="isCollapsed"
        [nzWidth]="240"
        [nzCollapsedWidth]="64"
        nzBreakpoint="lg"
        class="!fixed !left-0 !top-0 !bottom-0 !z-20 overflow-auto h-screen"
      >
        <!-- Logo -->
        <div class="h-16 flex items-center justify-center border-b border-[#002140]">
          @if (!isCollapsed) {
            <span class="text-white text-xl font-bold tracking-wide">
              <span nz-icon nzType="dashboard" nzTheme="outline" class="mr-2"></span>
              OpsHub
            </span>
          } @else {
            <span class="text-white text-xl font-bold">O</span>
          }
        </div>

        <!-- Nav Menu -->
        <ul nz-menu nzMode="inline" nzTheme="dark" class="border-r-0">
          @for (item of menuItems(); track item.path) {
            <li nz-menu-item
                [routerLink]="item.path"
                routerLinkActive="ant-menu-item-selected"
                [routerLinkActiveOptions]="{exact: false}">
              <span nz-icon [nzType]="item.icon" nzTheme="outline"></span>
              <span>{{ item.label }}</span>
            </li>
          }
        </ul>
      </nz-sider>

      <!-- Main Layout -->
      <nz-layout [class]="isCollapsed ? 'ml-16' : 'ml-60'" class="transition-all duration-200">
        <!-- Header -->
        <nz-header class="!bg-white !px-6 flex items-center justify-between shadow-sm border-b border-gray-200 !h-16 !leading-[64px] sticky top-0 z-10">
          <!-- Left: Search -->
          <div class="flex items-center">
            <app-header-search-bar></app-header-search-bar>
          </div>

          <!-- Right: Notifications & User -->
          <div class="flex items-center gap-4">
            <app-notification-bell></app-notification-bell>

            <div class="h-8 w-px bg-gray-200"></div>

            <!-- User Dropdown -->
            <a nz-dropdown [nzDropdownMenu]="userMenu" class="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-primary-500">
              <nz-avatar
                [nzText]="auth.currentUser()?.email?.charAt(0)?.toUpperCase() || 'U'"
                [nzSize]="32"
                nzShape="circle"
                class="bg-blue-100 text-blue-700"
              ></nz-avatar>
              <span class="text-sm font-medium hidden sm:inline">
                {{ auth.currentUser()?.email?.split('@')?.[0] || 'ユーザー' }}
              </span>
              <span nz-icon nzType="down" nzTheme="outline" class="text-xs"></span>
            </a>
            <nz-dropdown-menu #userMenu="nzDropdownMenu">
              <ul nz-menu>
                <li nz-menu-item class="!cursor-default !hover:bg-transparent">
                  <div class="py-1">
                    <p class="text-sm font-semibold text-gray-900 m-0">{{ auth.currentUser()?.email?.split('@')?.[0] || 'ユーザー' }}</p>
                    <p class="text-xs text-gray-500 m-0">{{ auth.currentUser()?.email }}</p>
                  </div>
                </li>
                <li nz-menu-divider></li>
                <li nz-menu-item>
                  <span nz-icon nzType="user" nzTheme="outline" class="mr-2"></span>
                  プロフィール設定
                </li>
                <li nz-menu-divider></li>
                <li nz-menu-item nzDanger (click)="auth.logout()">
                  <span nz-icon nzType="logout" nzTheme="outline" class="mr-2"></span>
                  ログアウト
                </li>
              </ul>
            </nz-dropdown-menu>
          </div>
        </nz-header>

        <!-- Content -->
        <nz-content class="p-6">
          <router-outlet />
        </nz-content>
      </nz-layout>
    </nz-layout>
  `,
  styles: [`
    :host { display: block; }
    nz-sider { box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15); }
  `],
})
export class AppShellComponent {
  auth = inject(AuthService);
  isCollapsed = false;

  /** ロールに応じたメニュー項目（Ant Design アイコン名に変換済み） */
  menuItems = computed(() => {
    const items = [
      { path: '/dashboard', icon: 'dashboard', label: 'ダッシュボード', roles: ['*'] },
      { path: '/workflows', icon: 'file-text', label: '申請', roles: ['*'] },
      { path: '/projects', icon: 'project', label: 'プロジェクト', roles: ['*'] },
      { path: '/timesheets', icon: 'clock-circle', label: '工数', roles: ['member', 'pm'] },
      { path: '/expenses', icon: 'wallet', label: '経費', roles: ['*'] },
      { path: '/invoices', icon: 'file-done', label: '請求書', roles: ['accounting', 'pm', 'tenant_admin'] },
      { path: '/search', icon: 'search', label: '検索', roles: ['*'] },
      { path: '/admin', icon: 'setting', label: '管理', roles: ['tenant_admin', 'it_admin'] },
    ];
    return items.filter((item) =>
      item.roles.includes('*') || item.roles.some((r) => this.auth.hasRole(r)),
    );
  });
}
