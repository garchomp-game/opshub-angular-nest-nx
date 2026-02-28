import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroWrenchScrewdriver } from '@ng-icons/heroicons/outline';

@Component({
 selector: 'app-placeholder',
 standalone: true,
 imports: [NgIcon],
 viewProviders: [provideIcons({ heroWrenchScrewdriver })],
 template: `
  <div class="h-[calc(100vh-64px)] w-full flex items-center justify-center p-6">
   <div class="hero bg-base-200 rounded-2xl max-w-lg">
    <div class="hero-content text-center py-16">
     <div>
      <ng-icon name="heroWrenchScrewdriver" class="text-5xl text-base-content/30 mb-4" />
      <h2 class="text-2xl font-bold text-base-content mb-2">{{ title }}</h2>
      <p class="text-base-content/60">このモジュールは現在開発中です。今後のアップデートで実装される予定です。</p>
      <div class="flex items-center justify-center gap-2 mt-6">
       <div class="w-2 h-2 rounded-full bg-base-300 animate-pulse"></div>
       <div class="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style="animation-delay: 200ms"></div>
       <div class="w-2 h-2 rounded-full bg-base-300 animate-pulse" style="animation-delay: 400ms"></div>
      </div>
     </div>
    </div>
   </div>
  </div>
 `,
})
export class PlaceholderComponent {
 private route = inject(ActivatedRoute);
 title = this.route.snapshot.data['title'] ?? 'Feature';
}
