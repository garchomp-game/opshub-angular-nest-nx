import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/auth/auth.service';
import { HeaderSearchBarComponent } from './header-search-bar/header-search-bar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule,
    HeaderSearchBarComponent,
  ],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav mode="side" [opened]="true" class="app-sidenav">
        <mat-toolbar color="primary">OpsHub</mat-toolbar>
        <mat-nav-list>
          @for (item of menuItems(); track item.path) {
            <a mat-list-item
               [routerLink]="item.path"
               routerLinkActive="active">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar>
          <app-header-search-bar></app-header-search-bar>
          <span class="spacer"></span>
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>exit_to_app</mat-icon>
              ログアウト
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container { height: 100vh; }
    .app-sidenav { width: 240px; }
    .spacer { flex: 1 1 auto; }
    .content { padding: 24px; }
    .active { background: rgba(0,0,0,0.04); }
  `],
})
export class AppShellComponent {
  auth = inject(AuthService);

  /** ロールに応じたメニュー項目 */
  menuItems = computed(() => {
    const items = [
      { path: '/dashboard', icon: 'dashboard', label: 'ダッシュボード', roles: ['*'] },
      { path: '/workflows', icon: 'description', label: '申請', roles: ['*'] },
      { path: '/projects', icon: 'folder', label: 'プロジェクト', roles: ['*'] },
      { path: '/timesheets', icon: 'schedule', label: '工数', roles: ['member', 'pm'] },
      { path: '/expenses', icon: 'payments', label: '経費', roles: ['*'] },
      { path: '/invoices', icon: 'receipt', label: '請求書', roles: ['accounting', 'pm', 'tenant_admin'] },
      { path: '/search', icon: 'search', label: '検索', roles: ['*'] },
      { path: '/admin', icon: 'settings', label: '管理', roles: ['tenant_admin', 'it_admin'] },
    ];
    return items.filter((item) =>
      item.roles.includes('*') || item.roles.some((r) => this.auth.hasRole(r)),
    );
  });
}
