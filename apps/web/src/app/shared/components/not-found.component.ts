import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroExclamationTriangle, heroHome } from '@ng-icons/heroicons/outline';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [RouterLink, NgIcon],
    viewProviders: [provideIcons({ heroExclamationTriangle, heroHome })],
    template: `
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <ng-icon name="heroExclamationTriangle" class="text-7xl text-warning mb-6" />
      <h1 class="text-4xl font-bold mb-2">404</h1>
      <p class="text-xl text-base-content/60 mb-8">お探しのページは見つかりませんでした</p>
      <a routerLink="/dashboard" class="btn btn-primary gap-2">
        <ng-icon name="heroHome" class="text-lg" />
        ダッシュボードに戻る
      </a>
    </div>
  `,
})
export class NotFoundComponent { }
