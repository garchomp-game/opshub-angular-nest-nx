import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-header-search-bar',
    standalone: true,
    imports: [FormsModule, InputTextModule, IconFieldModule, InputIconModule, ButtonModule],
    template: `
  <p-iconfield data-testid="header-search-wrapper">
   <p-inputicon styleClass="pi pi-search" />
   <input pInputText type="text" [(ngModel)]="query" (keyup.enter)="onSearch()"
       placeholder="検索..." class="w-64"
       data-testid="header-search-input" />
  </p-iconfield>
  @if (query) {
   <p-button icon="pi pi-times" [rounded]="true" [text]="true" size="small"
       (onClick)="query = ''" data-testid="header-search-clear" />
  }
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
