import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft, heroPencil, heroTrash, heroPrinter,
  heroPaperAirplane, heroCheckCircle, heroXCircle,
  heroArrowPath, heroInformationCircle, heroListBullet, heroDocumentText,
} from '@ng-icons/heroicons/outline';
import { InvoicesService, Invoice } from './invoices.service';
import {
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS,
  INVOICE_TRANSITIONS, InvoiceStatus,
} from '@shared/types';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, NgIcon,
  ],
  viewProviders: [provideIcons({
    heroArrowLeft, heroPencil, heroTrash, heroPrinter,
    heroPaperAirplane, heroCheckCircle, heroXCircle,
    heroArrowPath, heroInformationCircle, heroListBullet, heroDocumentText,
  })],
  template: `
    <div class="min-h-[calc(100vh-64px)] bg-base-200/50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto">
        <!-- Back Button -->
        <div class="mb-6">
          <a routerLink="/invoices"
            class="btn btn-ghost btn-sm gap-1 text-base-content/70"
            data-testid="back-btn">
            <ng-icon name="heroArrowLeft" class="text-lg" />
            請求書一覧へ戻る
          </a>
        </div>

        @if (invoicesService.isLoading()) {
          <div class="flex justify-center items-center py-24" data-testid="loading">
            <span class="loading loading-spinner loading-lg text-primary"></span>
          </div>
        } @else if (invoice(); as inv) {
          <!-- Header -->
          <div class="card bg-base-100 shadow-sm mb-6">
            <div class="card-body flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <h1 class="text-3xl font-bold text-base-content m-0 tracking-tight">{{ inv.invoiceNumber }}</h1>
                  <span class="badge" [ngClass]="getBadgeClass(inv.status)" data-testid="status-chip">
                    {{ getStatusLabel(inv.status) }}
                  </span>
                </div>
                <p class="text-base-content/60 m-0 text-sm">取引先: <span class="font-medium text-base-content">{{ inv.clientName }}</span></p>
              </div>

              <div class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                @if (inv.status === 'draft') {
                  <a [routerLink]="['/invoices', inv.id, 'edit']"
                    class="btn btn-outline btn-sm gap-1"
                    data-testid="edit-btn">
                    <ng-icon name="heroPencil" class="text-lg" />
                    編集
                  </a>
                  <button class="btn btn-error btn-outline btn-sm gap-1"
                      (click)="onDelete()"
                      data-testid="delete-btn">
                    <ng-icon name="heroTrash" class="text-lg" />
                    削除
                  </button>
                }
                <a [routerLink]="['/invoices', inv.id, 'print']"
                  class="btn btn-primary btn-sm gap-1"
                  data-testid="print-btn">
                  <ng-icon name="heroPrinter" class="text-lg" />
                  印刷
                </a>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column: Main Content -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Items Table -->
              <div class="card bg-base-100 shadow-sm">
                <div class="card-body">
                  <div class="flex items-center gap-2 mb-4">
                    <ng-icon name="heroListBullet" class="text-base-content/40" />
                    <h2 class="text-base font-bold text-base-content m-0">請求明細</h2>
                  </div>
                  <div class="overflow-x-auto" data-testid="items-table">
                    <table class="table">
                      <thead>
                        <tr>
                          <th>項目名・詳細</th>
                          <th class="text-right w-24">数量</th>
                          <th class="text-right w-32">単価</th>
                          <th class="text-right w-36">金額</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of inv.items ?? []; track item) {
                          <tr data-testid="item-row">
                            <td><span class="font-medium text-base-content">{{ item.description }}</span></td>
                            <td class="text-right text-base-content/60 font-mono">{{ item.quantity | number }}</td>
                            <td class="text-right text-base-content/60 font-mono">¥{{ item.unitPrice | number }}</td>
                            <td class="text-right"><span class="font-bold text-base-content text-base font-mono">¥{{ item.amount | number }}</span></td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <!-- Totals -->
                  <div class="bg-base-200/50 p-6 sm:px-8 border-t border-base-200 -mx-8 -mb-8 mt-4 rounded-b-2xl" data-testid="totals">
                    <div class="max-w-sm ml-auto space-y-3">
                      <div class="flex justify-between items-center text-sm">
                        <span class="text-base-content/60 font-medium">小計</span>
                        <span class="font-mono text-base-content font-medium">¥{{ inv.subtotal | number }}</span>
                      </div>
                      <div class="flex justify-between items-center text-sm">
                        <span class="text-base-content/60 font-medium">消費税 ({{ inv.taxRate }}%)</span>
                        <span class="font-mono text-base-content font-medium">¥{{ inv.taxAmount | number }}</span>
                      </div>
                      <div class="border-t border-base-300 pt-3 mt-1 flex justify-between items-end">
                        <span class="text-base-content font-bold">小計 (税込)</span>
                        <span class="text-2xl sm:text-3xl font-bold text-primary tracking-tight font-mono">¥{{ inv.totalAmount | number }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              @if (inv.notes) {
                <div class="card bg-base-100 shadow-sm">
                  <div class="card-body">
                    <div class="flex items-center gap-2 mb-3">
                      <ng-icon name="heroDocumentText" class="text-base-content/40" />
                      <h2 class="text-base font-bold text-base-content m-0">備考</h2>
                    </div>
                    <p class="whitespace-pre-line text-base-content/80 m-0 leading-relaxed">{{ inv.notes }}</p>
                  </div>
                </div>
              }
            </div>

            <!-- Right Column: Info & Actions -->
            <div class="space-y-6">
              <!-- Info Card -->
              <div class="card bg-base-100 shadow-sm" data-testid="invoice-info">
                <div class="card-body">
                  <div class="flex items-center gap-2 mb-4">
                    <ng-icon name="heroInformationCircle" class="text-base-content/40" />
                    <h2 class="text-base font-bold text-base-content m-0">請求情報</h2>
                  </div>
                  <dl class="space-y-3">
                    <div class="flex justify-between py-2 border-b border-base-200">
                      <dt class="text-base-content/60 text-sm">取引先</dt>
                      <dd class="font-medium text-base-content text-sm">{{ inv.clientName }}</dd>
                    </div>
                    <div class="flex justify-between py-2 border-b border-base-200">
                      <dt class="text-base-content/60 text-sm">発行日</dt>
                      <dd class="font-medium text-base-content text-sm">{{ inv.issuedDate | date:'yyyy/MM/dd' }}</dd>
                    </div>
                    <div class="flex justify-between py-2 border-b border-base-200">
                      <dt class="text-base-content/60 text-sm">支払期限</dt>
                      <dd class="font-bold text-error text-sm">{{ inv.dueDate | date:'yyyy/MM/dd' }}</dd>
                    </div>
                    <div class="flex justify-between py-2 border-b border-base-200">
                      <dt class="text-base-content/60 text-sm">プロジェクト</dt>
                      <dd class="text-base-content text-sm">{{ inv.project?.name ?? 'なし' }}</dd>
                    </div>
                    <div class="flex justify-between py-2">
                      <dt class="text-base-content/60 text-sm">作成者</dt>
                      <dd class="text-base-content text-sm">{{ inv.creator?.profile?.displayName ?? '不明' }}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <!-- Status Actions -->
              @if (allowedTransitions.length > 0) {
                <div class="card bg-info/5 border border-info/20 shadow-sm">
                  <div class="card-body">
                    <div class="flex items-center gap-2 mb-4">
                      <ng-icon name="heroArrowPath" class="text-info" />
                      <h2 class="text-base font-bold text-base-content m-0">ステータス変更</h2>
                    </div>
                    <div class="flex flex-col gap-3">
                      @for (transition of allowedTransitions; track transition) {
                        <button class="btn btn-block"
                            [ngClass]="transition === 'cancelled' ? 'btn-error btn-outline' : 'btn-primary'"
                            (click)="onStatusChange(transition)"
                            [attr.data-testid]="'status-' + transition + '-btn'">
                          <ng-icon [name]="getTransitionIcon(transition)" class="text-lg" />
                          {{ getStatusLabel(transition) }}にする
                        </button>
                      }
                    </div>
                  </div>
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

  getBadgeClass(status: string): string {
    switch (status) {
      case 'draft': return 'badge-ghost';
      case 'sent': return 'badge-warning';
      case 'paid': return 'badge-success';
      case 'cancelled': return 'badge-error';
      default: return 'badge-ghost';
    }
  }

  getTransitionIcon(transition: string): string {
    switch (transition) {
      case 'sent': return 'heroPaperAirplane';
      case 'paid': return 'heroCheckCircle';
      case 'cancelled': return 'heroXCircle';
      default: return 'heroArrowPath';
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
