import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { AdminUsersService } from '../services/users.service';
import { ROLE_LABELS, Role } from '@shared/types';

@Component({
    selector: 'app-invite-modal',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
    ],
    template: `
    <h2 mat-dialog-title>ユーザー招待</h2>
    <mat-dialog-content>
      <form [formGroup]="form" data-testid="invite-form">
        <mat-form-field class="full-width">
          <mat-label>メールアドレス</mat-label>
          <input matInput formControlName="email" type="email" data-testid="invite-email-input">
          @if (form.get('email')?.hasError('email')) {
            <mat-error>有効なメールアドレスを入力してください</mat-error>
          }
          @if (form.get('email')?.hasError('required')) {
            <mat-error>メールアドレスは必須です</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>ロール</mat-label>
          <mat-select formControlName="role" data-testid="invite-role-select">
            @for (role of roleOptions; track role.value) {
              <mat-option [value]="role.value">{{ role.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>表示名（任意）</mat-label>
          <input matInput formControlName="displayName" data-testid="invite-name-input">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close data-testid="invite-cancel-btn">キャンセル</button>
      <button mat-raised-button color="primary"
              [disabled]="form.invalid"
              (click)="onSubmit()"
              data-testid="invite-submit-btn">
        招待する
      </button>
    </mat-dialog-actions>
  `,
    styles: [`.full-width { width: 100%; margin-bottom: 8px; }`],
})
export class InviteModalComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<InviteModalComponent>);
    private usersService = inject(AdminUsersService);

    form: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        role: [Role.MEMBER, Validators.required],
        displayName: [''],
    });

    roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

    onSubmit(): void {
        if (this.form.valid) {
            this.usersService.inviteUser(this.form.value);
            this.dialogRef.close(true);
        }
    }
}
