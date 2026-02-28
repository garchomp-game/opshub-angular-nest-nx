import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AdminUsersService } from '../services/users.service';
import { ROLE_LABELS, Role } from '@shared/types';

@Component({
  selector: 'app-invite-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
  ],
  template: `
  <p-dialog header="ユーザー招待" [(visible)]="visible" [modal]="true"
      [style]="{ width: '30rem' }" (onHide)="onCancel()"
      data-testid="invite-dialog">

    <div class="flex items-center gap-3 rounded-lg p-3 mb-5"
        style="background: var(--p-blue-50); color: var(--p-blue-700);"
        data-testid="invite-info">
      <i class="pi pi-info-circle text-lg"></i>
      <span class="text-sm">指定したメールアドレス宛に招待メールを送信します。ユーザーは受け取ったリンクからパスワードを設定してログインできます。</span>
    </div>

    <form [formGroup]="form" data-testid="invite-form" class="flex flex-col gap-5">
      <div class="flex flex-col gap-2">
        <label for="invite-email" class="font-medium text-sm">メールアドレス <span class="text-red-500">*</span></label>
        <input pInputText id="invite-email" type="email"
            formControlName="email" placeholder="user@example.com"
            class="w-full"
            data-testid="invite-email-input">
        @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
          <small class="text-red-500">メールアドレスは必須です</small>
        } @else if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
          <small class="text-red-500">有効なメールアドレスを入力してください</small>
        }
      </div>

      <div class="flex flex-col gap-2">
        <label for="invite-role" class="font-medium text-sm">ロール <span class="text-red-500">*</span></label>
        <p-select formControlName="role" [options]="roleOptions"
            optionLabel="label" optionValue="value"
            placeholder="ロールを選択" inputId="invite-role"
            styleClass="w-full"
            data-testid="invite-role-select" />
      </div>

      <div class="flex flex-col gap-2">
        <label for="invite-name" class="font-medium text-sm">表示名（任意）</label>
        <input pInputText id="invite-name"
            formControlName="displayName" placeholder="山田 太郎"
            class="w-full"
            data-testid="invite-name-input">
        <small style="color: var(--p-text-muted-color)">後からユーザー自身で変更することも可能です。</small>
      </div>
    </form>

    <ng-template #footer>
      <div class="flex justify-end gap-2">
        <p-button label="キャンセル" severity="secondary" [text]="true"
            (onClick)="onCancel()" data-testid="invite-cancel-btn" />
        <p-button label="招待を送信" icon="pi pi-send"
            [disabled]="form.invalid"
            (onClick)="onSubmit()"
            data-testid="invite-submit-btn" />
      </div>
    </ng-template>
  </p-dialog>
 `,
  styles: [],
})
export class InviteModalComponent {
  private fb = inject(FormBuilder);
  private usersService = inject(AdminUsersService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: [Role.MEMBER, Validators.required],
    displayName: [''],
  });

  roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

  onSubmit(): void {
    if (this.form.valid) {
      this.usersService.inviteUser(this.form.value);
      this.close();
    }
  }

  onCancel(): void {
    this.close();
  }

  private close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.form.reset({ email: '', role: Role.MEMBER, displayName: '' });
  }
}
