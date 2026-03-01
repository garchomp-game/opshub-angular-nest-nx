import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterLink,
        InputTextModule,
        ButtonModule,
        MessageModule,
        CardModule,
        IconFieldModule,
        InputIconModule,
    ],
    template: `
  <div class="min-h-screen flex items-center justify-center p-4" style="background: linear-gradient(135deg, var(--p-surface-ground) 0%, var(--p-primary-100) 100%);">
   <p-card styleClass="max-w-md w-full shadow-lg" data-testid="forgot-password-card">
    <div class="px-4 py-2">
     <div class="text-center mb-6">
      <h1 class="text-2xl font-bold m-0" style="color: var(--p-text-color);">パスワードリセット</h1>
      <p class="mt-2 text-sm" style="color: var(--p-text-muted-color);">登録されたメールアドレスにリセットリンクを送信します</p>
     </div>

     @if (sent()) {
      <p-message severity="success" data-testid="success-message" styleClass="w-full mb-4">
       パスワードリセットメールを送信しました
      </p-message>
      <div class="text-center mt-4">
       <a routerLink="/login" class="text-sm font-medium" style="color: var(--p-primary-color);" data-testid="back-to-login">
        <i class="pi pi-arrow-left mr-1"></i>ログイン画面に戻る
       </a>
      </div>
     } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()" data-testid="forgot-password-form" class="flex flex-col gap-5">
       <div class="flex flex-col gap-1">
        <label for="email" class="font-medium text-sm" style="color: var(--p-text-color);">メールアドレス</label>
        <p-iconfield>
         <p-inputicon styleClass="pi pi-envelope" />
         <input pInputText formControlName="email" type="email"
             id="email" placeholder="you@example.com"
             data-testid="email-input"
             class="w-full" />
        </p-iconfield>
        @if (form.get('email')?.touched && form.get('email')?.invalid) {
         <small class="text-red-500">
          @if (form.get('email')?.hasError('required')) {
           メールアドレスは必須です
          } @else if (form.get('email')?.hasError('email')) {
           有効なメールアドレスを入力してください
          }
         </small>
        }
       </div>

       @if (errorMessage()) {
        <p-message severity="error" data-testid="error-message">
         {{ errorMessage() }}
        </p-message>
       }

       <p-button type="submit" label="リセットメールを送信"
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
export class ForgotPasswordComponent {
    private auth = inject(AuthService);
    private fb = inject(FormBuilder);

    sent = signal(false);
    loading = signal(false);
    errorMessage = signal('');
    currentYear = new Date().getFullYear();

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
    });

    onSubmit(): void {
        if (this.form.invalid) return;

        const email = this.form.value.email!;
        this.loading.set(true);
        this.errorMessage.set('');

        this.auth.forgotPassword(email).subscribe({
            next: () => {
                this.sent.set(true);
                this.loading.set(false);
            },
            error: (err) => {
                this.errorMessage.set(
                    err.error?.message ?? 'エラーが発生しました。もう一度お試しください。',
                );
                this.loading.set(false);
            },
        });
    }
}
