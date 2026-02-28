import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <i class="pi pi-exclamation-triangle text-7xl mb-6" style="color: var(--p-yellow-500);"></i>
      <h1 class="text-4xl font-bold mb-2">404</h1>
      <p class="text-xl opacity-60 mb-8">お探しのページは見つかりませんでした</p>
      <p-button label="ダッシュボードに戻る" icon="pi pi-home" routerLink="/dashboard" />
    </div>
  `,
})
export class NotFoundComponent { }
