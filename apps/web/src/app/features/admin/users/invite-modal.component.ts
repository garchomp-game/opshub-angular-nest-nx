import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroUserPlus, heroInformationCircle, heroPaperAirplane } from '@ng-icons/heroicons/outline';
import { AdminUsersService } from '../services/users.service';
import { ROLE_LABELS, Role } from '@shared/types';
import { ModalRef, FormFieldComponent } from '../../../shared/ui';

@Component({
  selector: 'app-invite-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIcon,
    FormFieldComponent,
  ],
  viewProviders: [provideIcons({ heroUserPlus, heroInformationCircle, heroPaperAirplane })],
  template: `
  <div class="modal-box">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <ng-icon name="heroUserPlus" class="text-xl" />
      </div>
      <span class="text-xl font-bold">ユーザー招待</span>
    </div>

    <div class="alert mb-5" data-testid="invite-info">
      <ng-icon name="heroInformationCircle" class="text-lg text-info" />
      <span class="text-sm">指定したメールアドレス宛に招待メールを送信します。ユーザーは受け取ったリンクからパスワードを設定してログインできます。</span>
    </div>

    <form [formGroup]="form" data-testid="invite-form" class="space-y-4">
      <app-form-field label="メールアドレス" [required]="true"
              [errorMessage]="form.get('email')?.touched && form.get('email')?.hasError('required') ? 'メールアドレスは必須です' : form.get('email')?.touched && form.get('email')?.hasError('email') ? '有効なメールアドレスを入力してください' : ''">
        <input class="input w-full" type="email"
            formControlName="email" placeholder="user@example.com"
            data-testid="invite-email-input">
      </app-form-field>

      <app-form-field label="ロール" [required]="true">
        <select class="select w-full"
            formControlName="role"
            data-testid="invite-role-select">
          @for (role of roleOptions; track role.value) {
            <option [value]="role.value">{{ role.label }}</option>
          }
        </select>
      </app-form-field>

      <app-form-field label="表示名（任意）" hint="後からユーザー自身で変更することも可能です。">
        <input class="input w-full"
            formControlName="displayName" placeholder="山田 太郎"
            data-testid="invite-name-input">
      </app-form-field>
    </form>

    <div class="modal-action">
      <button class="btn" (click)="onCancel()" data-testid="invite-cancel-btn">
        キャンセル
      </button>
      <button class="btn btn-primary gap-2"
          [disabled]="form.invalid"
          (click)="onSubmit()"
          data-testid="invite-submit-btn">
        <ng-icon name="heroPaperAirplane" class="text-lg" />
        招待を送信
      </button>
    </div>
  </div>
 `,
  styles: [],
})
export class InviteModalComponent {
  private fb = inject(FormBuilder);
  private modalRef = inject(ModalRef);
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
      this.modalRef.close(true);
    }
  }

  onCancel(): void {
    this.modalRef.close();
  }
}
