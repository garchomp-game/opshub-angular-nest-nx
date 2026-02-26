import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { InvoicesService } from './invoices.service';

@Component({
    selector: 'app-invoice-print-view',
    standalone: true,
    imports: [
        CommonModule,
        NzButtonModule, NzIconModule, NzSpinModule,
    ],
    template: `
        <div class="min-h-screen bg-gray-50/50 flex flex-col pt-6 pb-12 print:bg-white print:p-0 print:m-0">
            @if (invoicesService.isLoading()) {
                <div class="flex justify-center items-center py-24" data-testid="loading">
                    <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                </div>
            } @else if (invoice(); as inv) {
                <!-- Print Actions (Hidden when printing) -->
                <div class="max-w-[794px] mx-auto w-full mb-6 print:hidden px-4 sm:px-0 flex justify-between items-center" data-testid="print-actions">
                    <button nz-button nzType="text" (click)="onBack()" class="!text-gray-600 hover:!bg-gray-200 !rounded-lg !px-4 transition-colors" data-testid="back-btn">
                        <span nz-icon nzType="arrow-left" nzTheme="outline" class="mr-1"></span>
                        戻る
                    </button>
                    <button nz-button nzType="primary" (click)="onPrint()" class="!rounded-lg shadow-sm font-bold !px-6" data-testid="print-trigger-btn">
                        <span nz-icon nzType="printer" nzTheme="outline" class="mr-1"></span>
                        印刷する
                    </button>
                </div>

                <!-- A4 Print Container -->
                <div class="bg-white mx-auto print-content shadow-sm print:shadow-none border border-gray-200 print:border-none" data-testid="print-content">
                    
                    <!-- Header -->
                    <div class="text-center mb-12">
                        <h1 class="text-3xl font-bold tracking-[0.5em] mb-4 text-gray-900 ml-[0.5em]">請 求 書</h1>
                        <div class="text-gray-500 font-mono text-sm">No. {{ inv.invoiceNumber }}</div>
                    </div>

                    <!-- Meta Information -->
                    <div class="flex justify-between items-end mb-12">
                        <div class="w-1/2 pr-8">
                            <div class="border-b-2 border-gray-900 pb-2 mb-2">
                                <span class="text-xl font-bold text-gray-900">{{ inv.clientName }}</span>
                                <span class="text-lg ml-2 text-gray-800">御中</span>
                            </div>
                            <p class="text-sm text-gray-600 mt-4">下記の通りご請求申し上げます。</p>
                        </div>
                        <div class="text-right text-sm">
                            <div class="mb-1"><span class="text-gray-500 mr-4">発行日:</span><span class="text-gray-900">{{ inv.issuedDate | date:'yyyy年MM月dd日' }}</span></div>
                            <div class="mb-4"><span class="text-gray-500 mr-4">支払期限:</span><span class="font-bold text-gray-900">{{ inv.dueDate | date:'yyyy年MM月dd日' }}</span></div>
                            
                            @if (inv.project) {
                                <div class="mb-1"><span class="text-gray-500 mr-4">件名:</span><span class="text-gray-900">{{ inv.project.name }}</span></div>
                            }
                        </div>
                    </div>

                    <!-- Total Amount Box -->
                    <div class="bg-blue-50/30 border-2 border-blue-900 rounded-lg p-6 flex justify-between items-center mb-12 py-5 px-8">
                        <span class="text-lg font-bold text-blue-900 tracking-wider">ご請求金額 (税込)</span>
                        <div class="flex items-baseline gap-1 relative top-1">
                            <span class="text-2xl font-bold text-blue-900">¥</span>
                            <span class="text-4xl font-bold text-blue-900 font-mono tracking-tight">{{ inv.totalAmount | number }}</span>
                            <span class="text-lg text-blue-900 ml-2">-</span>
                        </div>
                    </div>

                    <!-- Items Table (plain HTML for print) -->
                    <table class="w-full mb-8 border-collapse">
                        <thead>
                            <tr class="bg-gray-50 border-y-2 border-gray-900">
                                <th class="py-3 px-4 text-left text-sm font-bold text-gray-900">内容 / 品目</th>
                                <th class="py-3 px-4 text-right text-sm font-bold text-gray-900 w-24">数量</th>
                                <th class="py-3 px-4 text-right text-sm font-bold text-gray-900 w-32">単価</th>
                                <th class="py-3 px-4 text-right text-sm font-bold text-gray-900 w-40">金額</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 border-b-2 border-gray-900">
                            @for (item of inv.items; track item.id) {
                                <tr data-testid="print-item-row" class="break-inside-avoid">
                                    <td class="py-4 px-4 text-gray-900">{{ item.description }}</td>
                                    <td class="py-4 px-4 text-right text-gray-800">{{ item.quantity | number }}</td>
                                    <td class="py-4 px-4 text-right text-gray-800">¥{{ item.unitPrice | number }}</td>
                                    <td class="py-4 px-4 text-right text-gray-900 font-medium font-mono">¥{{ item.amount | number }}</td>
                                </tr>
                            }
                        </tbody>
                    </table>

                    <!-- Totals Section -->
                    <div class="flex justify-end mb-16 break-inside-avoid">
                        <div class="w-72">
                            <div class="flex justify-between py-2 border-b border-gray-100 text-sm">
                                <span class="text-gray-600">小計</span>
                                <span class="text-gray-900 font-mono">¥{{ inv.subtotal | number }}</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-200 text-sm">
                                <span class="text-gray-600">消費税 ({{ inv.taxRate }}%)</span>
                                <span class="text-gray-900 font-mono">¥{{ inv.taxAmount | number }}</span>
                            </div>
                            <div class="flex justify-between py-3 border-b-2 border-gray-900">
                                <span class="font-bold text-gray-900">合計</span>
                                <span class="font-bold text-gray-900 font-mono text-lg tracking-tight">¥{{ inv.totalAmount | number }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Notes Section -->
                    @if (inv.notes) {
                        <div class="border border-gray-300 rounded-lg p-6 bg-gray-50/30 break-inside-avoid">
                            <h3 class="text-sm font-bold text-gray-900 mb-2 border-b border-gray-200 pb-2 inline-block">備考</h3>
                            <p class="text-gray-700 whitespace-pre-line text-sm leading-relaxed m-0">{{ inv.notes }}</p>
                        </div>
                    }
                </div>
            }
        </div>
    `,
    styles: [`
        /* A4 Size styling */
        .print-content { 
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            /* Using Noto Sans JP or similar sans-serif for clean print */
            font-family: 'Helvetica Neue', Arial, 'Yu Gothic', 'Meiryo', sans-serif;
            color: #111827; /* gray-900 */
        }

        /* Essential print styles */
        @media print {
            @page {
                size: A4;
                margin: 0; 
            }
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .print-content {
                width: 100%;
                min-height: auto;
                padding: 15mm 20mm;
                border: none !important;
                box-shadow: none !important;
            }
            /* Ensure background colors print */
            .bg-blue-50\\/30 { background-color: rgba(239, 246, 255, 0.3) !important; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .bg-gray-50\\/30 { background-color: rgba(249, 250, 251, 0.3) !important; }
            
            /* Ensure borders print */
            .border-gray-900 { border-color: #111827 !important; }
            .border-blue-900 { border-color: #1e3a8a !important; }
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
