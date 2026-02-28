import { Component, input } from '@angular/core';

@Component({
  selector: 'app-list-page',
  standalone: true,
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <!-- ヘッダー -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-base-content m-0">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="text-base-content/60 mt-1 mb-0 text-sm">{{ subtitle() }}</p>
          }
        </div>
        <div class="flex items-center gap-2">
          <ng-content select="[slot=actions]" />
        </div>
      </div>

      <!-- フィルタ -->
      <ng-content select="[slot=filters]" />

      <!-- メインコンテンツ -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-0">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class ListPageComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
