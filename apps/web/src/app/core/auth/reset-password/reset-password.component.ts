import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterLink,
        PasswordModule,
        ButtonModule,
        MessageModule,
        CardModule,
    ],
    template: `
  <div class="min-h-screen flex items-center justify-center p-4" style="background: linear-gradient(135deg, var(--p-surface-ground) 0%, var(--p-primary-100) 100%);">
   <p-card styleClass="max-w-md w-full shadow-lg" data-testid="reset-password-card">
    <div class="px-4 py-2">
     <div class="text-center mb-6">
      <h1 class="text-2xl font-bold m-0" style="color: var(--p-text-color);">新しいパスワードの設定</h1>
      <p class="mt-2 text-sm" style="color: var(--p-text-muted-color);">新しいパスワードを入力してください</p>
     </div>

     @if (!token()) {
      <p-message severity="error" data-testid="token-error" styleClass="w-full mb-4">
       無効なリセットリンクです。もう一度パスワードリセットをお試しください。
      </p-message>
      <div class="text-center mt-4">
       <a routerLink="/forgot-password" class="text-sm font-medium" style="color: var(--p-primary-color);" data-testid="retry-link">
        パスワードリセットをやり直す
       </a>
      </div>
     } @else if (success()) {
      <p-message severity="success" data-testid="success-message" styleClass="w-full mb-4">
       パスワードが正常にリセットされました。ログインページに移動します...
      </p-message>
     } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()" data-testid="reset-password-form" class="flex flex-col gap-5">
       <div class="flex flex-col gap-1">
        <label for="newPassword" class="font-medium text-sm" style="color: var(--p-text-color);">新しいパスワード</label>
        <p-password formControlName="newPassword"
            inputId="newPassword"
            placeholder="新しいパスワード"
            [toggleMask]="true"
            [feedback]="true"
            styleClass="w-full"
            inputStyleClass="w-full"
            data-testid="new-password-input" />
        @if (form.get('newPassword')?.touched && form.get('newPassword')?.invalid) {
         <small class="text-red-500">
          @if (form.get('newPassword')?.hasError('required')) {
           パスワードは必須です
          } @else if (form.get('newPassword')?.hasError('minlength')) {
           パスワードは8文字以上である必要があります
          } @else if (form.get('newPassword')?.hasError('pattern')) {
           パスワードは英字と数字の両方を含む必要があります
          }
         </small>
        }
       </div>

       <div class="flex flex-col gap-1">
        <label for="confirmPassword" class="font-medium text-sm" style="color: var(--p-text-color);">パスワード確認</label>
        <p-password formControlName="confirmPassword"
            inputId="confirmPassword"
            placeholder="パスワードを再入力"
            [toggleMask]="true"
            [feedback]="false"
            styleClass="w-full"
            inputStyleClass="w-full"
            data-testid="confirm-password-input" />
        @if (form.get('confirmPassword')?.touched && form.get('confirmPassword')?.invalid) {
         <small class="text-red-500">パスワードは必須です</small>
        }
        @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
         <small class="text-red-500" data-testid="mismatch-error">パスワードが一致しません</small>
        }
       </div>

       <!-- パスワード要件 -->
       <div class="text-xs flex flex-col gap-1" style="color: var(--p-text-muted-color);" data-testid="password-requirements">
        <span><i class="pi pi-info-circle mr-1"></i>パスワード要件:</span>
        <span class="ml-4">・8文字以上</span>
        <span class="ml-4">・英字と数字の両方を含む</span>
       </div>

       @if (errorMessage()) {
        <p-message severity="error" data-testid="error-message">
         {{ errorMessage() }}
        </p-message>
       }

       <p-button type="submit" label="パスワードを変更"
           [disabled]="form.invalid || loading()"
           [loading]="loading()"
           styleClass="w-full"
           data-testid="submit-button" />
      </form>

      <div class="text-center mt-4">
       <a routerLink="/login" class="text-sm font-medium" style="color: var(--p-primary-color);" data-testid="back-to-login">
        <i class="pi pi-arrow-left mr-1"></i>ログイン画面に戻る
       </a>
      </div>
     }

     <div class="mt-6 pt-4 text-center text-xs" style="border-top: 1px solid var(--p-surface-border); color: var(--p-text-muted-color);">
      &copy; {{ currentYear }} OpsHub Inc. All rights reserved.
     </div>
    </div>
   </p-card>
  </div>
 `,
    styles: [`
  :host {
   display: block;
  }
 `],
})
export class ResetPasswordComponent implements OnInit {
    private auth = inject(AuthService);
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    token = signal<string | null>(null);
    success = signal(false);
    loading = signal(false);
    errorMessage = signal('');
    currentYear = new Date().getFullYear();

    form = this.fb.group(
        {
            newPassword: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d)/),
            ]],
            confirmPassword: ['', [Validators.required]],
        },
        { validators: [this.passwordMatchValidator] },
    );

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.token.set(params['token'] ?? null);
        });
    }

    onSubmit(): void {
        if (this.form.invalid || !this.token()) return;

        const newPassword = this.form.value.newPassword ?? '';
        this.loading.set(true);
        this.errorMessage.set('');

        this.auth.resetPassword(this.token() ?? '', newPassword).subscribe({
            next: () => {
                this.success.set(true);
                this.loading.set(false);
                // 2秒後にログインページへリダイレクト
                setTimeout(() => this.router.navigate(['/login']), 2000);
            },
            error: (err) => {
                this.errorMessage.set(
                    err.error?.error?.message ?? err.error?.message ?? 'パスワードリセットに失敗しました',
                );
                this.loading.set(false);
            },
        });
    }

    private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('newPassword');
        const confirm = control.get('confirmPassword');
        if (password && confirm && password.value !== confirm.value) {
            return { passwordMismatch: true };
        }
        return null;
    }
}
