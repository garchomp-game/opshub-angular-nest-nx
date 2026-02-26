import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { InvoicesService, Invoice } from './invoices.service';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@shared/types';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [
        CommonModule, RouterLink, FormsModule,
        NzTableModule, NzSelectModule, NzButtonModule,
        NzIconModule, NzTagModule, NzSpinModule,
        NzCardModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 flex flex-col min-h-full">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 m-0 tracking-tight">請求書一覧</h1>
                    <p class="text-gray-500 mt-1 mb-0 text-sm">取引先への請求書の作成と管理を行います。</p>
                </div>
                <a nz-button nzType="primary" routerLink="new"
                   class="!rounded-lg shadow-sm font-bold"
                   data-testid="create-invoice-btn">
                    <span nz-icon nzType="plus" nzTheme="outline" class="mr-1"></span>
                    新規請求書
                </a>
            </div>

            <nz-card class="!rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1" [nzBordered]="false">
                <!-- Filters -->
                <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50" data-testid="invoice-filters">
                    <div class="flex flex-wrap items-center gap-4">
                        <nz-select [(ngModel)]="statusFilter"
                                   (ngModelChange)="onFilterChange()"
                                   nzPlaceHolder="ステータス"
                                   nzAllowClear
                                   class="w-full sm:w-64"
                                   data-testid="status-filter">
                            <nz-option nzValue="" nzLabel="すべて"></nz-option>
                            <nz-option nzValue="draft" nzLabel="下書き"></nz-option>
                            <nz-option nzValue="sent" nzLabel="送付済"></nz-option>
                            <nz-option nzValue="paid" nzLabel="入金済"></nz-option>
                            <nz-option nzValue="cancelled" nzLabel="キャンセル"></nz-option>
                        </nz-select>
                    </div>
                </div>

                <!-- Loading -->
                @if (invoicesService.isLoading()) {
                    <div class="flex justify-center items-center flex-1 py-24" data-testid="loading">
                        <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                    </div>
                } @else {
                    @if (invoicesService.invoices().length === 0) {
                        <div class="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
                            <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <span nz-icon nzType="file-done" nzTheme="outline" class="text-3xl text-gray-400"></span>
                            </div>
                            <p class="text-lg font-bold text-gray-900 mb-1">請求書がありません</p>
                            <p class="text-gray-500 text-sm max-w-sm mb-6">条件に一致する請求書が見つからないか、まだ登録されていません。</p>
                            <a nz-button routerLink="new" class="!border-primary-200">
                                <span nz-icon nzType="plus" nzTheme="outline"></span>
                                最初の請求書を作成
                            </a>
                        </div>
                    } @else {
                        <nz-table
                            #invoiceTable
                            [nzData]="invoicesService.invoices()"
                            [nzFrontPagination]="false"
                            [nzTotal]="invoicesService.totalCount()"
                            [nzPageSize]="pageSize"
                            [nzPageIndex]="pageIndex"
                            (nzPageIndexChange)="onPageIndexChange($event)"
                            (nzPageSizeChange)="onPageSizeChange($event)"
                            [nzPageSizeOptions]="[10, 20, 50]"
                            nzShowSizeChanger
                            [nzShowTotal]="totalTemplate"
                            nzSize="middle"
                            data-testid="invoice-table">
                            <ng-template #totalTemplate let-total>
                                合計 {{ total }} 件
                            </ng-template>
                            <thead>
                                <tr>
                                    <th>請求番号</th>
                                    <th>取引先</th>
                                    <th nzAlign="right" nzWidth="140px">合計金額</th>
                                    <th nzWidth="120px">ステータス</th>
                                    <th nzWidth="130px">発行日</th>
                                    <th nzWidth="130px">支払期限</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (row of invoiceTable.data; track row.id) {
                                    <tr (click)="onRowClick(row)"
                                        class="cursor-pointer"
                                        data-testid="invoice-row">
                                        <td>
                                            <span class="font-mono font-medium text-gray-900">{{ row.invoiceNumber }}</span>
                                        </td>
                                        <td>
                                            <div class="flex items-center gap-3">
                                                <div class="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                                    {{ row.clientName.charAt(0) }}
                                                </div>
                                                <span class="font-medium text-gray-900">{{ row.clientName }}</span>
                                            </div>
                                        </td>
                                        <td class="text-right">
                                            <span class="font-bold text-gray-900 text-base">¥{{ row.totalAmount | number }}</span>
                                        </td>
                                        <td>
                                            <nz-tag [nzColor]="getTagColor(row.status)">
                                                {{ getStatusLabel(row.status) }}
                                            </nz-tag>
                                        </td>
                                        <td>
                                            <span class="text-gray-600">{{ row.issuedDate | date:'yyyy/MM/dd' }}</span>
                                        </td>
                                        <td>
                                            <div class="flex items-center gap-1.5" [class.text-red-600]="isOverdue(row)">
                                                @if (isOverdue(row)) {
                                                    <span nz-icon nzType="warning" nzTheme="outline" class="text-sm"></span>
                                                }
                                                <span [class.font-bold]="isOverdue(row)" [class.text-gray-600]="!isOverdue(row)">
                                                    {{ row.dueDate | date:'yyyy/MM/dd' }}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </nz-table>
                    }
                }
            </nz-card>
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

    ngOnInit(): void {
        this.loadData();
    }

    getStatusLabel(status: string): string {
        return (INVOICE_STATUS_LABELS as any)[status] ?? status;
    }

    getStatusColor(status: string): string {
        return (INVOICE_STATUS_COLORS as any)[status] ?? '';
    }

    getTagColor(status: string): string {
        switch (status) {
            case 'draft': return 'default';
            case 'sent': return 'processing';
            case 'paid': return 'success';
            case 'cancelled': return 'error';
            default: return 'default';
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
