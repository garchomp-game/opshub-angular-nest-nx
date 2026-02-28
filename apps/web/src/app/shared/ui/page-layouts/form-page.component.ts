import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-page',
  standalone: true,
  template: `
    <div class="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <!-- ヘッダー -->
      <div>
        <h1 class="text-2xl font-bold text-base-content m-0">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="text-base-content/60 mt-1 mb-0 text-sm">{{ subtitle() }}</p>
        }
      </div>

      <!-- フォーム -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <ng-content />
        </div>
      </div>

      <!-- アクション (保存/キャンセル) -->
      <ng-content select="[slot=actions]" />
    </div>
  `,
})
export class FormPageComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
