import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { InvoicesService, Invoice } from './invoices.service';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@shared/types';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [
        CommonModule, RouterLink, FormsModule,
        MatTableModule, MatSortModule, MatPaginatorModule,
        MatSelectModule, MatFormFieldModule, MatButtonModule,
        MatIconModule, MatChipsModule, MatProgressSpinnerModule,
        MatCardModule,
    ],
    template: `
        <div class="invoice-list-container">
            <div class="header">
                <h1>請求書一覧</h1>
                <a mat-raised-button color="primary" routerLink="new"
                   data-testid="create-invoice-btn">
                    <mat-icon>add</mat-icon> 新規請求書
                </a>
            </div>

            <!-- Filters -->
            <mat-card class="filter-card" data-testid="invoice-filters">
                <mat-card-content>
                    <div class="filters">
                        <mat-form-field>
                            <mat-label>ステータス</mat-label>
                            <mat-select [(value)]="statusFilter"
                                        (selectionChange)="onFilterChange()"
                                        data-testid="status-filter">
                                <mat-option value="">すべて</mat-option>
                                <mat-option value="draft">下書き</mat-option>
                                <mat-option value="sent">送付済</mat-option>
                                <mat-option value="paid">入金済</mat-option>
                                <mat-option value="cancelled">キャンセル</mat-option>
                            </mat-select>
                        </mat-form-field>
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- Loading -->
            @if (invoicesService.isLoading()) {
                <div class="loading-container" data-testid="loading">
                    <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
                </div>
            }

            <!-- Table -->
            @if (!invoicesService.isLoading()) {
                @if (invoicesService.invoices().length === 0) {
                    <div class="empty-state" data-testid="empty-state">
                        <mat-icon>receipt_long</mat-icon>
                        <p>請求書がありません</p>
                    </div>
                } @else {
                    <table mat-table [dataSource]="invoicesService.invoices()"
                           matSort class="invoice-table" data-testid="invoice-table">
                        <ng-container matColumnDef="invoiceNumber">
                            <th mat-header-cell *matHeaderCellDef mat-sort-header>請求番号</th>
                            <td mat-cell *matCellDef="let row">{{ row.invoiceNumber }}</td>
                        </ng-container>
                        <ng-container matColumnDef="clientName">
                            <th mat-header-cell *matHeaderCellDef mat-sort-header>取引先</th>
                            <td mat-cell *matCellDef="let row">{{ row.clientName }}</td>
                        </ng-container>
                        <ng-container matColumnDef="totalAmount">
                            <th mat-header-cell *matHeaderCellDef>合計金額</th>
                            <td mat-cell *matCellDef="let row" class="text-right">
                                ¥{{ row.totalAmount | number }}
                            </td>
                        </ng-container>
                        <ng-container matColumnDef="status">
                            <th mat-header-cell *matHeaderCellDef>ステータス</th>
                            <td mat-cell *matCellDef="let row">
                                <mat-chip [color]="getStatusColor(row.status)">
                                    {{ getStatusLabel(row.status) }}
                                </mat-chip>
                            </td>
                        </ng-container>
                        <ng-container matColumnDef="issuedDate">
                            <th mat-header-cell *matHeaderCellDef mat-sort-header>発行日</th>
                            <td mat-cell *matCellDef="let row">{{ row.issuedDate | date:'yyyy/MM/dd' }}</td>
                        </ng-container>
                        <ng-container matColumnDef="dueDate">
                            <th mat-header-cell *matHeaderCellDef mat-sort-header>支払期限</th>
                            <td mat-cell *matCellDef="let row">{{ row.dueDate | date:'yyyy/MM/dd' }}</td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                            (click)="onRowClick(row)"
                            class="clickable-row"
                            data-testid="invoice-row"></tr>
                    </table>

                    <mat-paginator
                        [length]="invoicesService.totalCount()"
                        [pageSize]="20"
                        [pageSizeOptions]="[10, 20, 50]"
                        (page)="onPageChange($event)"
                        data-testid="invoice-paginator">
                    </mat-paginator>
                }
            }
        </div>
    `,
    styles: [`
        .invoice-list-container { padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .filter-card { margin-bottom: 16px; }
        .filters { display: flex; gap: 16px; flex-wrap: wrap; }
        .loading-container { display: flex; justify-content: center; padding: 48px; }
        .empty-state { text-align: center; padding: 48px; color: #666; }
        .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
        .invoice-table { width: 100%; }
        .clickable-row { cursor: pointer; }
        .clickable-row:hover { background-color: rgba(0, 0, 0, 0.04); }
        .text-right { text-align: right; }
    `],
})
export class InvoiceListComponent implements OnInit {
    invoicesService = inject(InvoicesService);
    private router = inject(Router);

    displayedColumns = ['invoiceNumber', 'clientName', 'totalAmount', 'status', 'issuedDate', 'dueDate'];
    statusFilter = '';

    ngOnInit(): void {
        this.loadData();
    }

    getStatusLabel(status: string): string {
        return (INVOICE_STATUS_LABELS as any)[status] ?? status;
    }

    getStatusColor(status: string): string {
        return (INVOICE_STATUS_COLORS as any)[status] ?? '';
    }

    onFilterChange(): void {
        this.loadData();
    }

    onPageChange(event: PageEvent): void {
        this.invoicesService.loadAll({
            status: this.statusFilter || undefined,
            page: event.pageIndex + 1,
            limit: event.pageSize,
        });
    }

    onRowClick(invoice: Invoice): void {
        this.router.navigate(['/invoices', invoice.id]);
    }

    private loadData(): void {
        this.invoicesService.loadAll({
            status: this.statusFilter || undefined,
        });
    }
}
