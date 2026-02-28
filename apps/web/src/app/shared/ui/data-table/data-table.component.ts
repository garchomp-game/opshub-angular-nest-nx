import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-data-table',
  standalone: true,
  template: `
    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <ng-content />
      </table>
    </div>

    @if (totalPages() > 1) {
      <div class="flex justify-center p-4">
        <div class="join">
          <button class="join-item btn btn-sm"
              [disabled]="page() <= 1"
              (click)="pageChange.emit(page() - 1)">«</button>
          @for (p of visiblePages(); track p) {
            <button class="join-item btn btn-sm"
                [class.btn-active]="p === page()"
                (click)="pageChange.emit(p)">{{ p }}</button>
          }
          <button class="join-item btn btn-sm"
              [disabled]="page() >= totalPages()"
              (click)="pageChange.emit(page() + 1)">»</button>
        </div>
      </div>
    }
  `,
})
export class DataTableComponent {
  page = input(1);
  pageSize = input(20);
  total = input(0);
  pageChange = output<number>();
  pageSizeChange = output<number>();

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()) || 1);

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 3);
    const end = Math.min(total, start + 6);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });
}
