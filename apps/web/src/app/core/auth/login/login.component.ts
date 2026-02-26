import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatCardModule, MatFormFieldModule, MatInputModule,
        MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    ],
    template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>OpsHub ログイン</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" data-testid="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>メールアドレス</mat-label>
              <input matInput formControlName="email" type="email" data-testid="email-input" />
              @if (form.get('email')?.hasError('required')) {
                <mat-error>メールアドレスは必須です</mat-error>
              }
              @if (form.get('email')?.hasError('email')) {
                <mat-error>有効なメールアドレスを入力してください</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>パスワード</mat-label>
              <input matInput formControlName="password"
                     [type]="hidePassword() ? 'password' : 'text'"
                     data-testid="password-input" />
              <button mat-icon-button matSuffix type="button"
                      (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('required')) {
                <mat-error>パスワードは必須です</mat-error>
              }
            </mat-form-field>

            @if (errorMessage()) {
              <p class="error-message" data-testid="error-message">{{ errorMessage() }}</p>
            }

            <button mat-raised-button color="primary"
                    type="submit" class="full-width"
                    [disabled]="form.invalid || auth.loading()"
                    data-testid="login-button">
              @if (auth.loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                ログイン
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
    }
    .login-card {
      width: 400px;
      padding: 24px;
    }
    .full-width { width: 100%; }
    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-bottom: 16px;
    }
    mat-form-field { margin-bottom: 8px; }
  `],
})
export class LoginComponent {
    auth = inject(AuthService);
    private fb = inject(FormBuilder);
    private router = inject(Router);

    hidePassword = signal(true);
    errorMessage = signal('');

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
