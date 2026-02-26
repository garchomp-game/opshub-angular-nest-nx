import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { InvoicesService, Invoice } from './invoices.service';
import {
    INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS,
    INVOICE_TRANSITIONS, InvoiceStatus,
} from '@shared/types';

@Component({
    selector: 'app-invoice-detail',
    standalone: true,
    imports: [
        CommonModule, RouterLink,
        MatButtonModule, MatIconModule, MatCardModule,
        MatChipsModule, MatTableModule, MatProgressSpinnerModule,
        MatDividerModule,
    ],
    template: `
        <div class="invoice-detail-container">
            @if (invoicesService.isLoading()) {
                <div class="loading-container" data-testid="loading">
                    <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
                </div>
            } @else if (invoice(); as inv) {
                <div class="header">
                    <div>
                        <h1>{{ inv.invoiceNumber }}</h1>
                        <mat-chip [color]="getStatusColor(inv.status)" data-testid="status-chip">
                            {{ getStatusLabel(inv.status) }}
                        </mat-chip>
                    </div>
                    <div class="header-actions">
                        @if (inv.status === 'draft') {
                            <a mat-stroked-button [routerLink]="['/invoices', inv.id, 'edit']"
                               data-testid="edit-btn">
                                <mat-icon>edit</mat-icon> 編集
                            </a>
                            <button mat-stroked-button color="warn" (click)="onDelete()"
                                    data-testid="delete-btn">
                                <mat-icon>delete</mat-icon> 削除
                            </button>
                        }
                        <a mat-stroked-button [routerLink]="['/invoices', inv.id, 'print']"
                           data-testid="print-btn">
                            <mat-icon>print</mat-icon> 印刷
                        </a>
                    </div>
                </div>

                <!-- Info Card -->
                <mat-card class="info-card" data-testid="invoice-info">
                    <mat-card-content>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="label">取引先</span>
                                <span class="value">{{ inv.clientName }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">発行日</span>
                                <span class="value">{{ inv.issuedDate | date:'yyyy/MM/dd' }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">支払期限</span>
                                <span class="value">{{ inv.dueDate | date:'yyyy/MM/dd' }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">プロジェクト</span>
                                <span class="value">{{ inv.project?.name ?? '-' }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">作成者</span>
                                <span class="value">{{ inv.creator?.profile?.displayName ?? '-' }}</span>
                            </div>
                        </div>
                    </mat-card-content>
                </mat-card>

                <!-- Items Table -->
                <mat-card class="items-card">
                    <mat-card-header>
                        <mat-card-title>明細</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                        <table mat-table [dataSource]="inv.items ?? []" class="items-table"
                               data-testid="items-table">
                            <ng-container matColumnDef="description">
                                <th mat-header-cell *matHeaderCellDef>説明</th>
                                <td mat-cell *matCellDef="let item">{{ item.description }}</td>
                            </ng-container>
                            <ng-container matColumnDef="quantity">
                                <th mat-header-cell *matHeaderCellDef>数量</th>
                                <td mat-cell *matCellDef="let item" class="text-right">{{ item.quantity }}</td>
                            </ng-container>
                            <ng-container matColumnDef="unitPrice">
                                <th mat-header-cell *matHeaderCellDef>単価</th>
                                <td mat-cell *matCellDef="let item" class="text-right">¥{{ item.unitPrice | number }}</td>
                            </ng-container>
                            <ng-container matColumnDef="amount">
                                <th mat-header-cell *matHeaderCellDef>金額</th>
                                <td mat-cell *matCellDef="let item" class="text-right">¥{{ item.amount | number }}</td>
                            </ng-container>

                            <tr mat-header-row *matHeaderRowDef="itemColumns"></tr>
                            <tr mat-row *matRowDef="let row; columns: itemColumns;"
                                data-testid="item-row"></tr>
                        </table>

                        <mat-divider></mat-divider>

                        <div class="totals" data-testid="totals">
                            <div class="total-row"><span>小計:</span><span>¥{{ inv.subtotal | number }}</span></div>
                            <div class="total-row"><span>消費税 ({{ inv.taxRate }}%):</span><span>¥{{ inv.taxAmount | number }}</span></div>
                            <div class="total-row grand-total"><span>合計:</span><span>¥{{ inv.totalAmount | number }}</span></div>
                        </div>
                    </mat-card-content>
                </mat-card>

                @if (inv.notes) {
                    <mat-card class="notes-card">
                        <mat-card-header><mat-card-title>備考</mat-card-title></mat-card-header>
                        <mat-card-content>
                            <p>{{ inv.notes }}</p>
                        </mat-card-content>
                    </mat-card>
                }

                <!-- Status Actions -->
                @if (allowedTransitions.length > 0) {
                    <mat-card class="status-card">
                        <mat-card-header><mat-card-title>ステータス変更</mat-card-title></mat-card-header>
                        <mat-card-content>
                            <div class="status-actions">
                                @for (transition of allowedTransitions; track transition) {
                                    <button mat-raised-button
                                            [color]="transition === 'cancelled' ? 'warn' : 'primary'"
                                            (click)="onStatusChange(transition)"
                                            [attr.data-testid]="'status-' + transition + '-btn'">
                                        {{ getStatusLabel(transition) }}にする
                                    </button>
                                }
                            </div>
                        </mat-card-content>
                    </mat-card>
                }
            }
        </div>
    `,
    styles: [`
        .invoice-detail-container { padding: 24px; max-width: 960px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
        .header h1 { margin: 0 8px 0 0; display: inline; }
        .header-actions { display: flex; gap: 8px; }
        .info-card, .items-card, .notes-card, .status-card { margin-bottom: 16px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .info-item .label { display: block; font-size: 0.85em; color: #666; }
        .info-item .value { font-weight: 500; }
        .items-table { width: 100%; }
        .text-right { text-align: right; }
        .totals { padding: 16px 0; }
        .total-row { display: flex; justify-content: flex-end; gap: 24px; padding: 4px 0; }
        .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 8px; margin-top: 4px; }
        .status-actions { display: flex; gap: 8px; }
        .loading-container { display: flex; justify-content: center; padding: 48px; }
    `],
})
export class InvoiceDetailComponent implements OnInit {
    invoicesService = inject(InvoicesService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    invoice = this.invoicesService.currentInvoice;
    itemColumns = ['description', 'quantity', 'unitPrice', 'amount'];

    get allowedTransitions(): string[] {
        const inv = this.invoice();
        if (!inv) return [];
        return (INVOICE_TRANSITIONS as any)[inv.status] ?? [];
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.invoicesService.loadOne(id);
        }
    }

    getStatusLabel(status: string): string {
        return (INVOICE_STATUS_LABELS as any)[status] ?? status;
    }

    getStatusColor(status: string): string {
        return (INVOICE_STATUS_COLORS as any)[status] ?? '';
    }

    onStatusChange(status: string): void {
        const inv = this.invoice();
        if (!inv) return;
        this.invoicesService.updateStatus(inv.id, status).subscribe(() => {
            this.invoicesService.loadOne(inv.id);
        });
    }

    onDelete(): void {
        const inv = this.invoice();
        if (!inv) return;
        if (confirm('この請求書を削除しますか？')) {
            this.invoicesService.deleteInvoice(inv.id).subscribe(() => {
                this.router.navigate(['/invoices']);
            });
        }
    }
}
