import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvoicesService } from './invoices.service';

@Component({
    selector: 'app-invoice-print-view',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    ],
    template: `
        @if (invoicesService.isLoading()) {
            <div class="loading-container" data-testid="loading">
                <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
            </div>
        } @else if (invoice(); as inv) {
            <div class="print-actions no-print">
                <button mat-raised-button color="primary" (click)="onPrint()"
                        data-testid="print-trigger-btn">
                    <mat-icon>print</mat-icon> 印刷
                </button>
                <button mat-button (click)="onBack()" data-testid="back-btn">戻る</button>
            </div>

            <div class="print-content" data-testid="print-content">
                <div class="print-header">
                    <h1>請 求 書</h1>
                    <div class="invoice-number">{{ inv.invoiceNumber }}</div>
                </div>

                <div class="print-meta">
                    <div class="client-info">
                        <p class="client-name">{{ inv.clientName }} 御中</p>
                    </div>
                    <div class="issued-info">
                        <p>発行日: {{ inv.issuedDate | date:'yyyy年MM月dd日' }}</p>
                        <p>支払期限: {{ inv.dueDate | date:'yyyy年MM月dd日' }}</p>
                    </div>
                </div>

                <div class="total-box">
                    <span class="total-label">ご請求金額</span>
                    <span class="total-value">¥{{ inv.totalAmount | number }}</span>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th class="col-desc">説明</th>
                            <th class="col-qty">数量</th>
                            <th class="col-price">単価</th>
                            <th class="col-amount">金額</th>
                        </tr>
                    </thead>
                    <tbody>
                        @for (item of inv.items; track item.id) {
                            <tr data-testid="print-item-row">
                                <td>{{ item.description }}</td>
                                <td class="text-right">{{ item.quantity }}</td>
                                <td class="text-right">¥{{ item.unitPrice | number }}</td>
                                <td class="text-right">¥{{ item.amount | number }}</td>
                            </tr>
                        }
                    </tbody>
                </table>

                <div class="totals-section">
                    <div class="total-row"><span>小計</span><span>¥{{ inv.subtotal | number }}</span></div>
                    <div class="total-row"><span>消費税 ({{ inv.taxRate }}%)</span><span>¥{{ inv.taxAmount | number }}</span></div>
                    <div class="total-row grand-total"><span>合計</span><span>¥{{ inv.totalAmount | number }}</span></div>
                </div>

                @if (inv.notes) {
                    <div class="notes-section">
                        <p class="notes-label">備考</p>
                        <p>{{ inv.notes }}</p>
                    </div>
                }
            </div>
        }
    `,
    styles: [`
        .loading-container { display: flex; justify-content: center; padding: 48px; }
        .print-actions { padding: 16px 24px; display: flex; gap: 8px; }
        .print-content { max-width: 794px; margin: 0 auto; padding: 40px; font-family: 'Noto Sans JP', sans-serif; }
        .print-header { text-align: center; margin-bottom: 32px; }
        .print-header h1 { font-size: 28px; letter-spacing: 8px; margin-bottom: 8px; }
        .invoice-number { color: #666; }
        .print-meta { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .client-name { font-size: 18px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 4px; }
        .issued-info { text-align: right; }
        .total-box {
            background: #f5f5f5; border: 2px solid #333; padding: 16px 24px;
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 24px;
        }
        .total-label { font-size: 16px; font-weight: bold; }
        .total-value { font-size: 24px; font-weight: bold; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px 12px; }
        .items-table th { background: #f5f5f5; font-weight: bold; text-align: left; }
        .col-desc { width: 50%; }
        .col-qty, .col-price, .col-amount { width: 16.6%; }
        .text-right { text-align: right; }
        .totals-section { margin-left: auto; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
        .grand-total { font-weight: bold; font-size: 1.1em; border-top: 2px solid #333; padding-top: 8px; margin-top: 4px; }
        .notes-section { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 16px; }
        .notes-label { font-weight: bold; margin-bottom: 4px; }

        @media print {
            .no-print { display: none !important; }
            .print-content { padding: 0; max-width: 100%; }
            body { margin: 0; }
        }
    `],
})
export class InvoicePrintViewComponent implements OnInit {
    invoicesService = inject(InvoicesService);
    private route = inject(ActivatedRoute);

    invoice = this.invoicesService.currentInvoice;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.invoicesService.loadOne(id);
        }
    }

    onPrint(): void {
        window.print();
    }

    onBack(): void {
        window.history.back();
    }
}
