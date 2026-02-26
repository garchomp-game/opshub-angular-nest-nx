import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzCardModule, NzFormModule, NzInputModule,
    NzButtonModule, NzIconModule, NzAlertModule, NzSpinModule,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4"
         style="background: linear-gradient(135deg, #001529 0%, #003a6b 50%, #005ba1 100%);">
      <nz-card class="w-full max-w-md" [nzBordered]="false"
               style="border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">OpsHub</h1>
          <p class="text-gray-500 mt-2 text-sm">システムにログインしてください</p>
        </div>

        <form nz-form [formGroup]="form" (ngSubmit)="onSubmit()" data-testid="login-form"
              nzLayout="vertical" class="space-y-1">
          <nz-form-item>
            <nz-form-label nzFor="email">メールアドレス</nz-form-label>
            <nz-form-control [nzErrorTip]="emailErrorTpl">
              <nz-input-group nzPrefixIcon="mail" nzSize="large">
                <input nz-input formControlName="email" type="email"
                       id="email" placeholder="you@example.com"
                       data-testid="email-input" />
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
            <nz-form-label nzFor="password">パスワード</nz-form-label>
            <nz-form-control nzErrorTip="パスワードは必須です">
              <nz-input-group nzPrefixIcon="lock" [nzSuffix]="suffixTpl" nzSize="large">
                <input nz-input formControlName="password"
                       [type]="hidePassword() ? 'password' : 'text'"
                       id="password" placeholder="パスワード"
                       data-testid="password-input" />
              </nz-input-group>
              <ng-template #suffixTpl>
                <span nz-icon
                      [nzType]="hidePassword() ? 'eye-invisible' : 'eye'"
                      class="cursor-pointer text-gray-400 hover:text-gray-600"
                      (click)="hidePassword.set(!hidePassword())"></span>
              </ng-template>
            </nz-form-control>
          </nz-form-item>

          @if (errorMessage()) {
            <nz-alert nzType="error" [nzMessage]="errorMessage()"
                      nzShowIcon data-testid="error-message"
                      class="mb-4"></nz-alert>
          }

          <nz-form-item class="mb-0 pt-2">
            <button nz-button nzType="primary" nzBlock nzSize="large"
                    type="submit"
                    [disabled]="form.invalid || auth.loading()"
                    [nzLoading]="auth.loading()"
                    data-testid="login-button"
                    style="height: 48px; border-radius: 10px; font-size: 16px; font-weight: 500;">
              ログイン
            </button>
          </nz-form-item>
        </form>

        <div class="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
          &copy; {{ currentYear }} OpsHub Inc. All rights reserved.
        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    /* NG-ZORRO form spacing adjustment */
    ::ng-deep .ant-form-vertical .ant-form-item {
      margin-bottom: 16px;
    }
    ::ng-deep .ant-card-body {
      padding: 40px;
    }
    ::ng-deep .ant-input-affix-wrapper {
      border-radius: 10px;
    }
  `],
})
export class LoginComponent {
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  hidePassword = signal(true);
  errorMessage = signal('');
  currentYear = new Date().getFullYear();

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;
    this.errorMessage.set('');

    this.auth.login(email!, password!).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.error?.message ?? 'ログインに失敗しました',
        );
      },
    });
  }
}
