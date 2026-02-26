import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-header-search-bar',
    standalone: true,
    imports: [
        FormsModule,
        MatFormFieldModule, MatInputModule, MatIconModule,
    ],
    template: `
    <mat-form-field appearance="outline" class="header-search" subscriptSizing="dynamic">
      <input matInput
             [(ngModel)]="query"
             (keyup.enter)="onSearch()"
             placeholder="検索..."
             data-testid="header-search-input">
      <mat-icon matSuffix (click)="onSearch()" style="cursor: pointer">search</mat-icon>
    </mat-form-field>
  `,
    styles: [`
    .header-search {
      width: 240px;
      font-size: 14px;
    }
    .header-search ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    :host ::ng-deep .mat-mdc-text-field-wrapper {
      height: 36px;
    }
    :host ::ng-deep .mat-mdc-form-field-infix {
      padding-top: 4px;
      padding-bottom: 4px;
      min-height: unset;
    }
  `],
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
