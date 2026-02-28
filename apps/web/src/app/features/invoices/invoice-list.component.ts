import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InvoicesService, Invoice } from './invoices.service';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@shared/types';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, PaginatorModule, TagModule,
    ButtonModule, SelectModule, ProgressSpinnerModule,
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold m-0" style="color: var(--p-text-color);">請求書一覧</h1>
          <p class="mt-1 text-sm m-0" style="color: var(--p-text-muted-color);">取引先への請求書の作成と管理を行います。</p>
        </div>
        <p-button
          routerLink="new"
          icon="pi pi-plus"
          label="新規請求書"
          size="small"
          data-testid="create-invoice-btn" />
      </div>

      <!-- Filters -->
      <div class="mb-4" data-testid="invoice-filters">
        <p-select
          [(ngModel)]="statusFilter"
          (ngModelChange)="onFilterChange()"
          [options]="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="すべて"
          [showClear]="true"
          styleClass="w-full sm:w-64"
          data-testid="status-filter" />
      </div>

      <!-- Loading -->
      @if (invoicesService.isLoading()) {
        <div class="flex justify-center items-center py-24" data-testid="loading">
          <p-progressspinner strokeWidth="4" />
        </div>
      } @else {
        @if (invoicesService.invoices().length === 0) {
          <div class="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4" style="background: var(--p-surface-100);">
              <i class="pi pi-file text-3xl" style="color: var(--p-text-muted-color);"></i>
            </div>
            <p class="text-lg font-bold mb-1" style="color: var(--p-text-color);">請求書がありません</p>
            <p class="text-sm max-w-sm mb-6" style="color: var(--p-text-muted-color);">条件に一致する請求書が見つからないか、まだ登録されていません。</p>
            <p-button
              routerLink="new"
              icon="pi pi-plus"
              label="最初の請求書を作成"
              severity="secondary"
              [outlined]="true"
              size="small" />
          </div>
        } @else {
          <p-table
            [value]="invoicesService.invoices()"
            [tableStyle]="{ 'min-width': '60rem' }"
            styleClass="p-datatable-striped"
            data-testid="invoice-table">
            <ng-template #header>
              <tr>
                <th>請求番号</th>
                <th>取引先</th>
                <th class="text-right">合計金額</th>
                <th>ステータス</th>
                <th>発行日</th>
                <th>支払期限</th>
              </tr>
            </ng-template>
            <ng-template #body let-row>
              <tr (click)="onRowClick(row)"
                class="cursor-pointer"
                data-testid="invoice-row">
                <td>
                  <span class="font-mono font-medium" style="color: var(--p-text-color);">{{ row.invoiceNumber }}</span>
                </td>
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded flex items-center justify-center font-bold text-xs uppercase"
                      style="background: color-mix(in srgb, var(--p-primary-color) 10%, transparent); color: var(--p-primary-color);">
                      {{ row.clientName.charAt(0) }}
                    </div>
                    <span class="font-medium" style="color: var(--p-text-color);">{{ row.clientName }}</span>
                  </div>
                </td>
                <td class="text-right">
                  <span class="font-bold text-base font-mono" style="color: var(--p-text-color);">¥{{ row.totalAmount | number }}</span>
                </td>
                <td>
                  <p-tag [severity]="getTagSeverity(row.status)" [value]="getStatusLabel(row.status)" data-testid="status-badge" />
                </td>
                <td>
                  <span style="color: var(--p-text-muted-color);">{{ row.issuedDate | date:'yyyy/MM/dd' }}</span>
                </td>
                <td>
                  <div class="flex items-center gap-1.5" [class.text-red-500]="isOverdue(row)">
                    @if (isOverdue(row)) {
                      <i class="pi pi-exclamation-triangle text-sm"></i>
                    }
                    <span [class.font-bold]="isOverdue(row)" [style.color]="isOverdue(row) ? '' : 'var(--p-text-muted-color)'">
                      {{ row.dueDate | date:'yyyy/MM/dd' }}
                    </span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>

          <p-paginator
            [rows]="pageSize"
            [totalRecords]="invoicesService.totalCount()"
            [first]="(pageIndex - 1) * pageSize"
            [rowsPerPageOptions]="[10, 20, 50]"
            (onPageChange)="onPaginatorChange($event)" />
        }
      }
    </div>
  `,
  styles: [],
})
export class InvoiceListComponent implements OnInit {
  invoicesService = inject(InvoicesService);
  private router = inject(Router);

  statusFilter = '';
  pageIndex = 1;
  pageSize = 20;

  statusOptions = [
    { label: '下書き', value: 'draft' },
    { label: '送付済', value: 'sent' },
    { label: '入金済', value: 'paid' },
    { label: 'キャンセル', value: 'cancelled' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  getStatusLabel(status: string): string {
    return (INVOICE_STATUS_LABELS as any)[status] ?? status;
  }

  getStatusColor(status: string): string {
    return (INVOICE_STATUS_COLORS as any)[status] ?? '';
  }

  getTagSeverity(status: string): 'secondary' | 'warn' | 'success' | 'danger' | 'info' | 'contrast' | undefined {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'warn';
      case 'paid': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadData();
  }

  onPaginatorChange(event: any): void {
    this.pageIndex = Math.floor(event.first / event.rows) + 1;
    this.pageSize = event.rows;
    this.invoicesService.loadAll({
      status: this.statusFilter || undefined,
      page: this.pageIndex,
      limit: this.pageSize,
    });
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.invoicesService.loadAll({
      status: this.statusFilter || undefined,
      page: pageIndex,
      limit: this.pageSize,
    });
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.invoicesService.loadAll({
      status: this.statusFilter || undefined,
      page: 1,
      limit: pageSize,
    });
  }

  onRowClick(invoice: Invoice): void {
    this.router.navigate(['/invoices', invoice.id]);
  }

  isOverdue(invoice: Invoice): boolean {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return false;
    }
    return new Date(invoice.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
  }

  private loadData(): void {
    this.invoicesService.loadAll({
      status: this.statusFilter || undefined,
    });
  }
}
