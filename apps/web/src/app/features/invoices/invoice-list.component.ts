import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroPlus, heroExclamationTriangle, heroDocumentDuplicate,
} from '@ng-icons/heroicons/outline';
import { InvoicesService, Invoice } from './invoices.service';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@shared/types';
import { ListPageComponent, DataTableComponent } from '../../shared/ui';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NgIcon, ListPageComponent, DataTableComponent,
  ],
  viewProviders: [provideIcons({ heroPlus, heroExclamationTriangle, heroDocumentDuplicate })],
  template: `
    <app-list-page title="請求書一覧" subtitle="取引先への請求書の作成と管理を行います。">
      <a slot="actions" routerLink="new"
        class="btn btn-primary btn-sm gap-1"
        data-testid="create-invoice-btn">
        <ng-icon name="heroPlus" class="text-lg" />
        新規請求書
      </a>

      <!-- Filters -->
      <div slot="filters" data-testid="invoice-filters">
        <select class="select w-full sm:w-64"
            [(ngModel)]="statusFilter"
            (ngModelChange)="onFilterChange()"
            data-testid="status-filter">
          <option value="">すべて</option>
          <option value="draft">下書き</option>
          <option value="sent">送付済</option>
          <option value="paid">入金済</option>
          <option value="cancelled">キャンセル</option>
        </select>
      </div>

      <!-- Loading -->
      @if (invoicesService.isLoading()) {
        <div class="flex justify-center items-center py-24" data-testid="loading">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      } @else {
        @if (invoicesService.invoices().length === 0) {
          <div class="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
            <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-4">
              <ng-icon name="heroDocumentDuplicate" class="text-3xl text-base-content/40" />
            </div>
            <p class="text-lg font-bold text-base-content mb-1">請求書がありません</p>
            <p class="text-base-content/60 text-sm max-w-sm mb-6">条件に一致する請求書が見つからないか、まだ登録されていません。</p>
            <a routerLink="new" class="btn btn-outline btn-sm gap-1">
              <ng-icon name="heroPlus" class="text-lg" />
              最初の請求書を作成
            </a>
          </div>
        } @else {
          <app-data-table
            [page]="pageIndex"
            [pageSize]="pageSize"
            [total]="invoicesService.totalCount()"
            (pageChange)="onPageIndexChange($event)">
            <thead>
              <tr>
                <th>請求番号</th>
                <th>取引先</th>
                <th class="text-right">合計金額</th>
                <th>ステータス</th>
                <th>発行日</th>
                <th>支払期限</th>
              </tr>
            </thead>
            <tbody data-testid="invoice-table">
              @for (row of invoicesService.invoices(); track row.id) {
                <tr (click)="onRowClick(row)"
                  class="cursor-pointer hover"
                  data-testid="invoice-row">
                  <td>
                    <span class="font-mono font-medium text-base-content">{{ row.invoiceNumber }}</span>
                  </td>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {{ row.clientName.charAt(0) }}
                      </div>
                      <span class="font-medium text-base-content">{{ row.clientName }}</span>
                    </div>
                  </td>
                  <td class="text-right">
                    <span class="font-bold text-base-content text-base font-mono">¥{{ row.totalAmount | number }}</span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getBadgeClass(row.status)" data-testid="status-badge">
                      {{ getStatusLabel(row.status) }}
                    </span>
                  </td>
                  <td>
                    <span class="text-base-content/60">{{ row.issuedDate | date:'yyyy/MM/dd' }}</span>
                  </td>
                  <td>
                    <div class="flex items-center gap-1.5" [class.text-error]="isOverdue(row)">
                      @if (isOverdue(row)) {
                        <ng-icon name="heroExclamationTriangle" class="text-sm" />
                      }
                      <span [class.font-bold]="isOverdue(row)" [class.text-base-content/60]="!isOverdue(row)">
                        {{ row.dueDate | date:'yyyy/MM/dd' }}
                      </span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </app-data-table>
        }
      }
    </app-list-page>
  `,
  styles: [],
})
export class InvoiceListComponent implements OnInit {
  invoicesService = inject(InvoicesService);
  private router = inject(Router);

  statusFilter = '';
  pageIndex = 1;
  pageSize = 20;

  ngOnInit(): void {
    this.loadData();
  }

  getStatusLabel(status: string): string {
    return (INVOICE_STATUS_LABELS as any)[status] ?? status;
  }

  getStatusColor(status: string): string {
    return (INVOICE_STATUS_COLORS as any)[status] ?? '';
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'draft': return 'badge-ghost';
      case 'sent': return 'badge-warning';
      case 'paid': return 'badge-success';
      case 'cancelled': return 'badge-error';
      default: return 'badge-ghost';
    }
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadData();
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
