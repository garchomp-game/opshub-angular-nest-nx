import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-header-search-bar',
  standalone: true,
  imports: [FormsModule, NzInputModule, NzIconModule],
  template: `
    <nz-input-group [nzPrefix]="prefixIcon" [nzSuffix]="suffixIcon" class="!w-[300px] !rounded-full">
      <input
        nz-input
        type="text"
        [(ngModel)]="query"
        (keyup.enter)="onSearch()"
        placeholder="検索..."
        class="!rounded-full !bg-gray-50"
        data-testid="header-search-input"
      >
    </nz-input-group>
    <ng-template #prefixIcon>
      <span nz-icon nzType="search" class="text-gray-400"></span>
    </ng-template>
    <ng-template #suffixIcon>
      @if (query) {
        <span nz-icon nzType="close-circle" nzTheme="fill"
              class="text-gray-400 cursor-pointer hover:text-gray-600"
              (click)="query = ''"></span>
      }
    </ng-template>
  `,
  styles: [],
})
export class HeaderSearchBarComponent {
  private router = inject(Router);
  query = '';

  onSearch(): void {
    if (!this.query.trim()) return;
    this.router.navigate(['/search'], {
      queryParams: { q: this.query },
    });
  }
}
