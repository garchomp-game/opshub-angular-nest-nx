import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, MessageModule, CardModule, IconFieldModule, InputIconModule],
    template: `
  <div class="min-h-screen flex items-center justify-center p-4" style="background: linear-gradient(135deg, var(--p-surface-ground) 0%, var(--p-primary-100) 100%);">
   <p-card styleClass="max-w-md w-full shadow-lg" data-testid="login-card">
    <div class="px-4 py-2">
     <div class="text-center mb-6">
      <h1 class="text-2xl font-bold m-0" style="color: var(--p-text-color);">OpsHub</h1>
      <p class="mt-2 text-sm" style="color: var(--p-text-muted-color);">システムにログインしてください</p>
     </div>

     <form [formGroup]="form" (ngSubmit)="onSubmit()" data-testid="login-form" class="flex flex-col gap-5">
      <!-- Email -->
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

      <!-- Password -->
      <div class="flex flex-col gap-1">
       <label for="password" class="font-medium text-sm" style="color: var(--p-text-color);">パスワード</label>
       <p-password formControlName="password"
           inputId="password"
           placeholder="パスワード"
           [toggleMask]="true"
           [feedback]="false"
           styleClass="w-full"
           inputStyleClass="w-full"
           data-testid="password-input" />
       @if (form.get('password')?.touched && form.get('password')?.invalid) {
        <small class="text-red-500">パスワードは必須です</small>
       }
      </div>

      <!-- Error message -->
      @if (errorMessage()) {
       <p-message severity="error" data-testid="error-message">
        {{ errorMessage() }}
       </p-message>
      }

      <!-- Submit button -->
      <p-button type="submit" label="ログイン"
          [disabled]="form.invalid || auth.loading()"
          [loading]="auth.loading()"
          styleClass="w-full"
          data-testid="login-button" />
     </form>

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
