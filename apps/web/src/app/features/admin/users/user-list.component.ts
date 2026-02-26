import { Component, OnInit, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminUsersService } from '../services/users.service';
import { InviteModalComponent } from './invite-modal.component';
import { ROLE_LABELS, USER_STATUS_LABELS } from '@shared/types';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatSelectModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        MatDialogModule,
    ],
    template: `
    <div class="user-management" data-testid="user-management">
      <div class="header">
        <h2>ユーザー管理</h2>
        <button mat-raised-button color="primary"
                (click)="openInviteDialog()"
                data-testid="invite-btn">
          <mat-icon>person_add</mat-icon>
          ユーザーを招待
        </button>
      </div>

      @if (usersService.loading()) {
        <mat-progress-spinner mode="indeterminate" diameter="40" data-testid="loading"></mat-progress-spinner>
      } @else {
        <table mat-table [dataSource]="usersService.users()" class="full-width" data-testid="users-table">
          <ng-container matColumnDef="displayName">
            <th mat-header-cell *matHeaderCellDef>名前</th>
            <td mat-cell *matCellDef="let user" data-testid="user-row">{{ user.displayName }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>メールアドレス</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>

          <ng-container matColumnDef="roles">
            <th mat-header-cell *matHeaderCellDef>ロール</th>
            <td mat-cell *matCellDef="let user">
              @for (role of user.roles; track role) {
                <mat-chip>{{ getRoleLabel(role) }}</mat-chip>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button color="warn"
                      (click)="onDeactivate(user.id)"
                      data-testid="deactivate-btn">
                <mat-icon>block</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        @if (usersService.users().length === 0) {
          <p class="empty-state" data-testid="empty-state">ユーザーが見つかりません</p>
        }
      }
    </div>
  `,
    styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .empty-state { text-align: center; padding: 24px; color: rgba(0,0,0,0.54); }
    mat-chip { margin: 2px; }
  `],
})
export class UserListComponent implements OnInit {
    usersService = inject(AdminUsersService);
    private dialog = inject(MatDialog);

    displayedColumns = ['displayName', 'email', 'roles', 'actions'];

    ngOnInit(): void {
        this.usersService.loadUsers();
    }

    getRoleLabel(role: string): string {
        return (ROLE_LABELS as any)[role] ?? role;
    }

    openInviteDialog(): void {
        this.dialog.open(InviteModalComponent, {
            width: '480px',
        });
    }

    onDeactivate(userId: string): void {
        if (confirm('このユーザーを無効化しますか？')) {
            this.usersService.updateStatus(userId, false);
        }
    }
}
