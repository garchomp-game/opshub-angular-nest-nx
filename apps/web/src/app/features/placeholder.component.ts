import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [NzResultModule, NzIconModule],
  template: `
    <div class="h-[calc(100vh-64px)] w-full flex items-center justify-center bg-gray-50/50 p-6">
      <nz-result nzStatus="info" [nzTitle]="title" nzSubTitle="このモジュールは現在開発中です。今後のアップデートで実装される予定です。">
        <div nz-result-extra>
          <div class="flex items-center justify-center gap-2">
            <div class="w-2 h-2 rounded-full bg-gray-200 animate-pulse"></div>
            <div class="w-2 h-2 rounded-full bg-blue-300 animate-pulse" style="animation-delay: 200ms"></div>
            <div class="w-2 h-2 rounded-full bg-gray-200 animate-pulse" style="animation-delay: 400ms"></div>
          </div>
        </div>
      </nz-result>
    </div>
  `,
})
export class PlaceholderComponent {
  private route = inject(ActivatedRoute);
  title = this.route.snapshot.data['title'] ?? 'Feature';
}
