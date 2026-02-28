import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroEnvelope, heroLockClosed, heroEye, heroEyeSlash } from '@ng-icons/heroicons/outline';
import { AuthService } from '../auth.service';

@Component({
 selector: 'app-login',
 standalone: true,
 imports: [ReactiveFormsModule, NgIcon],
 viewProviders: [provideIcons({ heroEnvelope, heroLockClosed, heroEye, heroEyeSlash })],
 template: `
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-base-300 to-primary/20">
   <div class="card bg-base-100 shadow-xl max-w-md w-full" data-testid="login-card">
    <div class="card-body px-10 py-10">
     <div class="text-center mb-6">
      <h1 class="card-title text-2xl font-bold justify-center">OpsHub</h1>
      <p class="text-base-content/60 mt-2 text-sm">システムにログインしてください</p>
     </div>

     <form [formGroup]="form" (ngSubmit)="onSubmit()" data-testid="login-form" class="space-y-4">
      <!-- Email -->
      <fieldset class="fieldset w-full">
       <label class="label" for="email">メールアドレス</label>
       <label class="input flex items-center gap-2 w-full">
        <ng-icon name="heroEnvelope" class="text-base-content/40 text-lg" />
        <input formControlName="email" type="email"
            id="email" placeholder="you@example.com"
            data-testid="email-input"
            class="grow" />
       </label>
       @if (form.get('email')?.touched && form.get('email')?.invalid) {
        <label class="label text-sm text-error">
         @if (form.get('email')?.hasError('required')) {
          メールアドレスは必須です
         } @else if (form.get('email')?.hasError('email')) {
          有効なメールアドレスを入力してください
         }
        </label>
       }
      </fieldset>

      <!-- Password -->
      <fieldset class="fieldset w-full">
       <label class="label" for="password">パスワード</label>
       <label class="input flex items-center gap-2 w-full">
        <ng-icon name="heroLockClosed" class="text-base-content/40 text-lg" />
        <input formControlName="password"
            [type]="hidePassword() ? 'password' : 'text'"
            id="password" placeholder="パスワード"
            data-testid="password-input"
            class="grow" />
        <button type="button" class="btn btn-ghost btn-xs btn-circle"
            (click)="hidePassword.set(!hidePassword())"
            data-testid="toggle-password">
         <ng-icon [name]="hidePassword() ? 'heroEye' : 'heroEyeSlash'" class="text-base-content/40 text-lg" />
        </button>
       </label>
       @if (form.get('password')?.touched && form.get('password')?.invalid) {
        <label class="label text-sm text-error">パスワードは必須です</label>
       }
      </fieldset>

      <!-- Error message -->
      @if (errorMessage()) {
       <div role="alert" class="alert alert-error text-sm" data-testid="error-message">
        <span>{{ errorMessage() }}</span>
       </div>
      }

      <!-- Submit button -->
      <button type="submit" class="btn btn-primary w-full"
          [disabled]="form.invalid || auth.loading()"
          data-testid="login-button">
       @if (auth.loading()) {
        <span class="loading loading-spinner loading-sm"></span>
       }
       ログイン
      </button>
     </form>

     <div class="mt-6 pt-4 border-t border-base-200 text-center text-xs text-base-content/40">
      &copy; {{ currentYear }} OpsHub Inc. All rights reserved.
     </div>
    </div>
   </div>
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
