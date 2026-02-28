import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroMagnifyingGlass, heroXMark } from '@ng-icons/heroicons/outline';

@Component({
 selector: 'app-header-search-bar',
 standalone: true,
 imports: [FormsModule, NgIcon],
 viewProviders: [provideIcons({ heroMagnifyingGlass, heroXMark })],
 template: `
  <label class="input input-sm w-64 flex items-center gap-2" data-testid="header-search-wrapper">
   <ng-icon name="heroMagnifyingGlass" class="text-base-content/40" />
   <input
    type="text"
    class="grow"
    [(ngModel)]="query"
    (keyup.enter)="onSearch()"
    placeholder="検索..."
    data-testid="header-search-input"
   >
   @if (query) {
    <button class="btn btn-ghost btn-xs btn-circle" (click)="query = ''" data-testid="header-search-clear">
     <ng-icon name="heroXMark" class="text-sm" />
    </button>
   }
  </label>
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
