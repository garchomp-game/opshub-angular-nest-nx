import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
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
        NzButtonModule, NzIconModule, NzCardModule,
        NzTagModule, NzTableModule, NzSpinModule,
        NzDividerModule, NzDescriptionsModule,
    ],
    template: `
        <div class="min-h-[calc(100vh-64px)] bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div class="max-w-5xl mx-auto">
                <!-- Back Button -->
                <div class="mb-6">
                    <a nz-button nzType="text" routerLink="/invoices" class="!text-gray-600 hover:!bg-gray-200 !rounded-lg !px-4 transition-colors">
                        <span nz-icon nzType="arrow-left" nzTheme="outline" class="mr-1"></span>
                        請求書一覧へ戻る
                    </a>
                </div>

                @if (invoicesService.isLoading()) {
                    <div class="flex justify-center items-center py-24" data-testid="loading">
                        <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                    </div>
                } @else if (invoice(); as inv) {
                    <!-- Header -->
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div class="flex items-center gap-3 mb-1">
                                <h1 class="text-3xl font-bold text-gray-900 m-0 tracking-tight">{{ inv.invoiceNumber }}</h1>
                                <nz-tag [nzColor]="getTagColor(inv.status)" data-testid="status-chip">
                                    {{ getStatusLabel(inv.status) }}
                                </nz-tag>
                            </div>
                            <p class="text-gray-500 m-0 text-sm">取引先: <span class="font-medium text-gray-900">{{ inv.clientName }}</span></p>
                        </div>
                        
                        <div class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                            @if (inv.status === 'draft') {
                                <a nz-button [routerLink]="['/invoices', inv.id, 'edit']"
                                   class="!border-gray-200 !text-gray-700 !rounded-lg"
                                   data-testid="edit-btn">
                                    <span nz-icon nzType="edit" nzTheme="outline" class="mr-1"></span>
                                    編集
                                </a>
                                <button nz-button nzDanger (click)="onDelete()"
                                        class="!rounded-lg"
                                        data-testid="delete-btn">
                                    <span nz-icon nzType="delete" nzTheme="outline" class="mr-1"></span>
                                    削除
                                </button>
                            }
                            <a nz-button nzType="primary" [routerLink]="['/invoices', inv.id, 'print']"
                               class="!rounded-lg shadow-sm font-bold ml-1"
                               data-testid="print-btn">
                                <span nz-icon nzType="printer" nzTheme="outline" class="mr-1"></span>
                                印刷
                            </a>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Left Column: Main Content -->
                        <div class="lg:col-span-2 space-y-6">
                            <!-- Items Table -->
                            <nz-card class="!rounded-2xl shadow-sm border border-gray-100 overflow-hidden" [nzBordered]="false">
                                <div class="flex items-center gap-2 mb-4">
                                    <span nz-icon nzType="unordered-list" nzTheme="outline" class="text-gray-400"></span>
                                    <h2 class="text-base font-bold text-gray-900 m-0">請求明細</h2>
                                </div>
                                <nz-table
                                    #itemsTable
                                    [nzData]="inv.items ?? []"
                                    [nzShowPagination]="false"
                                    [nzBordered]="false"
                                    nzSize="middle"
                                    data-testid="items-table">
                                    <thead>
                                        <tr>
                                            <th>項目名・詳細</th>
                                            <th nzAlign="right" nzWidth="100px">数量</th>
                                            <th nzAlign="right" nzWidth="130px">単価</th>
                                            <th nzAlign="right" nzWidth="150px">金額</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (item of itemsTable.data; track item) {
                                            <tr data-testid="item-row">
                                                <td><span class="font-medium text-gray-900">{{ item.description }}</span></td>
                                                <td class="text-right text-gray-600">{{ item.quantity | number }}</td>
                                                <td class="text-right text-gray-600">¥{{ item.unitPrice | number }}</td>
                                                <td class="text-right"><span class="font-bold text-gray-900 text-base">¥{{ item.amount | number }}</span></td>
                                            </tr>
                                        }
                                    </tbody>
                                </nz-table>

                                <!-- Totals -->
                                <div class="bg-gray-50/80 p-6 sm:px-8 border-t border-gray-100 -mx-6 -mb-6 mt-4" data-testid="totals">
                                    <div class="max-w-sm ml-auto space-y-3">
                                        <div class="flex justify-between items-center text-sm">
                                            <span class="text-gray-500 font-medium">小計</span>
                                            <span class="font-mono text-gray-900 font-medium">¥{{ inv.subtotal | number }}</span>
                                        </div>
                                        <div class="flex justify-between items-center text-sm">
                                            <span class="text-gray-500 font-medium">消費税 ({{ inv.taxRate }}%)</span>
                                            <span class="font-mono text-gray-900 font-medium">¥{{ inv.taxAmount | number }}</span>
                                        </div>
                                        <div class="border-t border-gray-200 pt-3 mt-1 flex justify-between items-end">
                                            <span class="text-gray-900 font-bold">小計 (税込)</span>
                                            <span class="text-2xl sm:text-3xl font-bold text-blue-700 tracking-tight">¥{{ inv.totalAmount | number }}</span>
                                        </div>
                                    </div>
                                </div>
                            </nz-card>

                            @if (inv.notes) {
                                <nz-card class="!rounded-2xl shadow-sm border border-gray-100" [nzBordered]="false">
                                    <div class="flex items-center gap-2 mb-3">
                                        <span nz-icon nzType="file-text" nzTheme="outline" class="text-gray-400"></span>
                                        <h2 class="text-base font-bold text-gray-900 m-0">備考</h2>
                                    </div>
                                    <p class="whitespace-pre-line text-gray-700 m-0 leading-relaxed">{{ inv.notes }}</p>
                                </nz-card>
                            }
                        </div>

                        <!-- Right Column: Info & Actions -->
                        <div class="space-y-6">
                            <!-- Info Card using nz-descriptions -->
                            <nz-card class="!rounded-xl shadow-sm border border-gray-100" [nzBordered]="false" data-testid="invoice-info">
                                <div class="flex items-center gap-2 mb-4">
                                    <span nz-icon nzType="info-circle" nzTheme="outline" class="text-gray-400"></span>
                                    <h2 class="text-base font-bold text-gray-900 m-0">請求情報</h2>
                                </div>
                                <nz-descriptions nzBordered [nzColumn]="1" nzSize="small">
                                    <nz-descriptions-item nzTitle="取引先">
                                        <span class="font-medium text-gray-900">{{ inv.clientName }}</span>
                                    </nz-descriptions-item>
                                    <nz-descriptions-item nzTitle="発行日">
                                        <span class="font-medium text-gray-900">{{ inv.issuedDate | date:'yyyy/MM/dd' }}</span>
                                    </nz-descriptions-item>
                                    <nz-descriptions-item nzTitle="支払期限">
                                        <span class="font-bold text-red-600">{{ inv.dueDate | date:'yyyy/MM/dd' }}</span>
                                    </nz-descriptions-item>
                                    <nz-descriptions-item nzTitle="プロジェクト">
                                        {{ inv.project?.name ?? 'なし' }}
                                    </nz-descriptions-item>
                                    <nz-descriptions-item nzTitle="作成者">
                                        {{ inv.creator?.profile?.displayName ?? '不明' }}
                                    </nz-descriptions-item>
                                </nz-descriptions>
                            </nz-card>

                            <!-- Status Actions -->
                            @if (allowedTransitions.length > 0) {
                                <nz-card class="!rounded-xl shadow-sm border border-blue-100 !bg-blue-50/30" [nzBordered]="false">
                                    <div class="flex items-center gap-2 mb-4">
                                        <span nz-icon nzType="sync" nzTheme="outline" class="text-blue-500"></span>
                                        <h2 class="text-base font-bold text-gray-900 m-0">ステータス変更</h2>
                                    </div>
                                    <div class="flex flex-col gap-3">
                                        @for (transition of allowedTransitions; track transition) {
                                            <button nz-button
                                                    [nzType]="transition === 'cancelled' ? 'default' : 'primary'"
                                                    [nzDanger]="transition === 'cancelled'"
                                                    nzBlock
                                                    nzSize="large"
                                                    (click)="onStatusChange(transition)"
                                                    class="!rounded-lg shadow-sm font-bold transition-transform active:scale-[0.98]"
                                                    [attr.data-testid]="'status-' + transition + '-btn'">
                                                <span nz-icon [nzType]="getTransitionIcon(transition)" nzTheme="outline" class="mr-1"></span>
                                                {{ getStatusLabel(transition) }}にする
                                            </button>
                                        }
                                    </div>
                                </nz-card>
                            }
                        </div>
                    </div>
                }
            </div>
        </div>
    `,
    styles: [],
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

    getTagColor(status: string): string {
        switch (status) {
            case 'draft': return 'default';
            case 'sent': return 'processing';
            case 'paid': return 'success';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    }

    getTransitionIcon(transition: string): string {
        switch (transition) {
            case 'sent': return 'send';
            case 'paid': return 'check-circle';
            case 'cancelled': return 'close-circle';
            default: return 'sync';
        }
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
