import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-placeholder',
    standalone: true,
    imports: [CardModule],
    template: `
  <div class="h-[calc(100vh-64px)] w-full flex items-center justify-center p-6">
   <p-card styleClass="max-w-lg text-center">
    <div class="py-8">
     <i class="pi pi-wrench text-5xl opacity-30 mb-4 block"></i>
     <h2 class="text-2xl font-bold mb-2">{{ title }}</h2>
     <p class="opacity-60">このモジュールは現在開発中です。今後のアップデートで実装される予定です。</p>
     <div class="flex items-center justify-center gap-2 mt-6">
      <div class="w-2 h-2 rounded-full animate-pulse" style="background-color: var(--p-surface-border);"></div>
      <div class="w-2 h-2 rounded-full animate-pulse" style="background-color: var(--p-primary-200); animation-delay: 200ms;"></div>
      <div class="w-2 h-2 rounded-full animate-pulse" style="background-color: var(--p-surface-border); animation-delay: 400ms;"></div>
     </div>
    </div>
   </p-card>
  </div>
 `,
})
export class PlaceholderComponent {
    private route = inject(ActivatedRoute);
    title = this.route.snapshot.data['title'] ?? 'Feature';
}
