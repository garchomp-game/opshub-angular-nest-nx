import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { CommonModule } from '@angular/common';
import { AdminUsersService } from '../services/users.service';
import { ROLE_LABELS, Role } from '@shared/types';

@Component({
    selector: 'app-invite-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzButtonModule,
        NzIconModule,
        NzAlertModule,
    ],
    template: `
    <div class="p-2">
        <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <span nz-icon nzType="user-add" nzTheme="outline" class="text-xl"></span>
            </div>
            <span class="text-xl font-bold text-gray-900">ユーザー招待</span>
        </div>

        <nz-alert nzType="info" nzShowIcon
                  nzMessage="指定したメールアドレス宛に招待メールを送信します。ユーザーは受け取ったリンクからパスワードを設定してログインできます。"
                  class="mb-5">
        </nz-alert>

        <form nz-form [formGroup]="form" nzLayout="vertical" data-testid="invite-form" class="space-y-4">
            <div class="shadow-sm border border-gray-100 p-5 rounded-xl bg-white space-y-4">
                <nz-form-item>
                    <nz-form-label nzRequired nzFor="invite-email">メールアドレス</nz-form-label>
                    <nz-form-control [nzErrorTip]="emailErrorTpl">
                        <nz-input-group nzPrefixIcon="mail">
                            <input nz-input id="invite-email" formControlName="email"
                                   type="email" placeholder="user@example.com"
                                   data-testid="invite-email-input">
                        </nz-input-group>
                        <ng-template #emailErrorTpl let-control>
                            @if (control.hasError('required')) {
                                メールアドレスは必須です
                            } @else if (control.hasError('email')) {
                                有効なメールアドレスを入力してください
                            }
                        </ng-template>
                    </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                    <nz-form-label nzRequired nzFor="invite-role">ロール</nz-form-label>
                    <nz-form-control>
                        <nz-select id="invite-role" formControlName="role"
                                   data-testid="invite-role-select" class="w-full">
                            @for (role of roleOptions; track role.value) {
                                <nz-option [nzValue]="role.value" [nzLabel]="role.label"></nz-option>
                            }
                        </nz-select>
                    </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                    <nz-form-label nzFor="invite-display-name">表示名（任意）</nz-form-label>
                    <nz-form-control nzExtra="後からユーザー自身で変更することも可能です。">
                        <nz-input-group nzPrefixIcon="idcard">
                            <input nz-input id="invite-display-name" formControlName="displayName"
                                   placeholder="山田 太郎"
                                   data-testid="invite-name-input">
                        </nz-input-group>
                    </nz-form-control>
                </nz-form-item>
            </div>
        </form>

        <div class="flex justify-end gap-2 mt-6">
            <button nz-button nzType="default" (click)="onCancel()" data-testid="invite-cancel-btn">
                キャンセル
            </button>
            <button nz-button nzType="primary"
                    [disabled]="form.invalid"
                    (click)="onSubmit()"
                    data-testid="invite-submit-btn">
                <span nz-icon nzType="send" nzTheme="outline"></span>
                招待を送信
            </button>
        </div>
    </div>
  `,
    styles: [],
})
export class InviteModalComponent {
    private fb = inject(FormBuilder);
    private modalRef = inject(NzModalRef);
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
