import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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
    CardModule, TableModule, TagModule,
    ButtonModule, ProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8" style="background: var(--p-surface-50);">
      <div class="max-w-5xl mx-auto">
        <!-- Back Button -->
        <div class="mb-6">
          <p-button
            routerLink="/invoices"
            icon="pi pi-arrow-left"
            label="請求書一覧へ戻る"
            severity="secondary"
            [text]="true"
            size="small"
            data-testid="back-btn" />
        </div>

        @if (invoicesService.isLoading()) {
          <div class="flex justify-center items-center py-24" data-testid="loading">
            <p-progressspinner strokeWidth="4" />
          </div>
        } @else if (invoice(); as inv) {
          <!-- Header -->
          <p-card styleClass="mb-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <h1 class="text-3xl font-bold m-0 tracking-tight" style="color: var(--p-text-color);">{{ inv.invoiceNumber }}</h1>
                  <p-tag [severity]="getTagSeverity(inv.status)" [value]="getStatusLabel(inv.status)" data-testid="status-chip" />
                </div>
                <p class="m-0 text-sm" style="color: var(--p-text-muted-color);">取引先: <span class="font-medium" style="color: var(--p-text-color);">{{ inv.clientName }}</span></p>
              </div>

              <div class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                @if (inv.status === 'draft') {
                  <p-button
                    [routerLink]="['/invoices', inv.id, 'edit']"
                    icon="pi pi-pencil"
                    label="編集"
                    severity="secondary"
                    [outlined]="true"
                    size="small"
                    data-testid="edit-btn" />
                  <p-button
                    icon="pi pi-trash"
                    label="削除"
                    severity="danger"
                    [outlined]="true"
                    size="small"
                    (onClick)="onDelete()"
                    data-testid="delete-btn" />
                }
                <p-button
                  [routerLink]="['/invoices', inv.id, 'print']"
                  icon="pi pi-print"
                  label="印刷"
                  size="small"
                  data-testid="print-btn" />
              </div>
            </div>
          </p-card>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column: Main Content -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Items Table -->
              <p-card>
                <div class="flex items-center gap-2 mb-4">
                  <i class="pi pi-list" style="color: var(--p-text-muted-color);"></i>
                  <h2 class="text-base font-bold m-0" style="color: var(--p-text-color);">請求明細</h2>
                </div>

                <p-table [value]="inv.items ?? []" [tableStyle]="{ 'min-width': '30rem' }" data-testid="items-table">
                  <ng-template #header>
                    <tr>
                      <th>項目名・詳細</th>
                      <th class="text-right w-24">数量</th>
                      <th class="text-right w-32">単価</th>
                      <th class="text-right w-36">金額</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-item>
                    <tr data-testid="item-row">
                      <td><span class="font-medium" style="color: var(--p-text-color);">{{ item.description }}</span></td>
                      <td class="text-right font-mono" style="color: var(--p-text-muted-color);">{{ item.quantity | number }}</td>
                      <td class="text-right font-mono" style="color: var(--p-text-muted-color);">¥{{ item.unitPrice | number }}</td>
                      <td class="text-right"><span class="font-bold text-base font-mono" style="color: var(--p-text-color);">¥{{ item.amount | number }}</span></td>
                    </tr>
                  </ng-template>
                </p-table>

                <!-- Totals -->
                <div class="p-6 sm:px-8 border-t -mx-5 -mb-5 mt-4 rounded-b-2xl" style="background: var(--p-surface-50); border-color: var(--p-surface-200);" data-testid="totals">
                  <div class="max-w-sm ml-auto space-y-3">
                    <div class="flex justify-between items-center text-sm">
                      <span class="font-medium" style="color: var(--p-text-muted-color);">小計</span>
                      <span class="font-mono font-medium" style="color: var(--p-text-color);">¥{{ inv.subtotal | number }}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                      <span class="font-medium" style="color: var(--p-text-muted-color);">消費税 ({{ inv.taxRate }}%)</span>
                      <span class="font-mono font-medium" style="color: var(--p-text-color);">¥{{ inv.taxAmount | number }}</span>
                    </div>
                    <div class="border-t pt-3 mt-1 flex justify-between items-end" style="border-color: var(--p-surface-300);">
                      <span class="font-bold" style="color: var(--p-text-color);">小計 (税込)</span>
                      <span class="text-2xl sm:text-3xl font-bold tracking-tight font-mono" style="color: var(--p-primary-color);">¥{{ inv.totalAmount | number }}</span>
                    </div>
                  </div>
                </div>
              </p-card>

              @if (inv.notes) {
                <p-card>
                  <div class="flex items-center gap-2 mb-3">
                    <i class="pi pi-file-edit" style="color: var(--p-text-muted-color);"></i>
                    <h2 class="text-base font-bold m-0" style="color: var(--p-text-color);">備考</h2>
                  </div>
                  <p class="whitespace-pre-line m-0 leading-relaxed" style="color: var(--p-text-muted-color);">{{ inv.notes }}</p>
                </p-card>
              }
            </div>

            <!-- Right Column: Info & Actions -->
            <div class="space-y-6">
              <!-- Info Card -->
              <p-card data-testid="invoice-info">
                <div class="flex items-center gap-2 mb-4">
                  <i class="pi pi-info-circle" style="color: var(--p-text-muted-color);"></i>
                  <h2 class="text-base font-bold m-0" style="color: var(--p-text-color);">請求情報</h2>
                </div>
                <dl class="space-y-3">
                  <div class="flex justify-between py-2 border-b" style="border-color: var(--p-surface-200);">
                    <dt class="text-sm" style="color: var(--p-text-muted-color);">取引先</dt>
                    <dd class="font-medium text-sm" style="color: var(--p-text-color);">{{ inv.clientName }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b" style="border-color: var(--p-surface-200);">
                    <dt class="text-sm" style="color: var(--p-text-muted-color);">発行日</dt>
                    <dd class="font-medium text-sm" style="color: var(--p-text-color);">{{ inv.issuedDate | date:'yyyy/MM/dd' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b" style="border-color: var(--p-surface-200);">
                    <dt class="text-sm" style="color: var(--p-text-muted-color);">支払期限</dt>
                    <dd class="font-bold text-sm" style="color: var(--p-red-500);">{{ inv.dueDate | date:'yyyy/MM/dd' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b" style="border-color: var(--p-surface-200);">
                    <dt class="text-sm" style="color: var(--p-text-muted-color);">プロジェクト</dt>
                    <dd class="text-sm" style="color: var(--p-text-color);">{{ inv.project?.name ?? 'なし' }}</dd>
                  </div>
                  <div class="flex justify-between py-2">
                    <dt class="text-sm" style="color: var(--p-text-muted-color);">作成者</dt>
                    <dd class="text-sm" style="color: var(--p-text-color);">{{ inv.creator?.profile?.displayName ?? '不明' }}</dd>
                  </div>
                </dl>
              </p-card>

              <!-- Status Actions -->
              @if (allowedTransitions.length > 0) {
                <div style="background: color-mix(in srgb, var(--p-primary-color) 5%, transparent); border-radius: var(--p-border-radius);">
                <p-card>
                  <div class="flex items-center gap-2 mb-4">
                    <i class="pi pi-sync" style="color: var(--p-primary-color);"></i>
                    <h2 class="text-base font-bold m-0" style="color: var(--p-text-color);">ステータス変更</h2>
                  </div>
                  <div class="flex flex-col gap-3">
                    @for (transition of allowedTransitions; track transition) {
                      <p-button
                          [label]="getStatusLabel(transition) + 'にする'"
                          [icon]="getTransitionIcon(transition)"
                          [severity]="transition === 'cancelled' ? 'danger' : 'primary'"
                          [outlined]="transition === 'cancelled'"
                          styleClass="w-full"
                          (onClick)="onStatusChange(transition)"
                          [attr.data-testid]="'status-' + transition + '-btn'" />
                    }
                  </div>
                </p-card>
                </div>
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

  getTagSeverity(status: string): 'secondary' | 'warn' | 'success' | 'danger' | 'info' | 'contrast' | undefined {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'warn';
      case 'paid': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  }

  getTransitionIcon(transition: string): string {
    switch (transition) {
      case 'sent': return 'pi pi-send';
      case 'paid': return 'pi pi-check-circle';
      case 'cancelled': return 'pi pi-times-circle';
      default: return 'pi pi-sync';
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
