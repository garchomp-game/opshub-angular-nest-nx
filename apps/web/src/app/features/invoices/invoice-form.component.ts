import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InvoicesService } from './invoices.service';
import { DEFAULT_TAX_RATE } from '@shared/types';

interface ProjectItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    TableModule, ButtonModule, SelectModule, DatePickerModule,
    InputNumberModule, InputTextModule, TextareaModule,
    ProgressSpinnerModule,
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold m-0" style="color: var(--p-text-color);">
          {{ isEdit ? '請求書を編集' : '新規請求書の作成' }}
        </h1>
        <p class="mt-1 text-sm m-0" style="color: var(--p-text-muted-color);">取引先への請求情報を入力してください</p>
      </div>

      @if (isLoading) {
        <div class="flex justify-center items-center py-24" data-testid="loading">
          <p-progressspinner strokeWidth="4" />
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-8" data-testid="invoice-form">
          <!-- 基本情報 -->
          <div>
            <div class="flex items-center gap-2 mb-5">
              <i class="pi pi-info-circle" style="color: var(--p-text-muted-color);"></i>
              <h2 class="text-base font-bold m-0" style="color: var(--p-text-color);">基本情報</h2>
            </div>

            <div class="space-y-4">
              <!-- 取引先名 -->
              <div class="flex flex-col gap-1">
                <label for="clientName" class="font-medium text-sm" style="color: var(--p-text-color);">取引先名 <span class="text-red-500">*</span></label>
                <input pInputText
                    formControlName="clientName"
                    id="clientName"
                    placeholder="例: 株式会社◯◯"
                    fluid
                    data-testid="client-name-input" />
                @if (form.get('clientName')?.touched && form.get('clientName')?.invalid) {
                  <small class="text-red-500">取引先名は必須です</small>
                }
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- 発行日 -->
                <div class="flex flex-col gap-1">
                  <label for="issuedDate" class="font-medium text-sm" style="color: var(--p-text-color);">発行日 <span class="text-red-500">*</span></label>
                  <p-datepicker
                      formControlName="issuedDate"
                      inputId="issuedDate"
                      dateFormat="yy/mm/dd"
                      [showIcon]="true"
                      styleClass="w-full"
                      data-testid="issued-date-input" />
                  @if (form.get('issuedDate')?.touched && form.get('issuedDate')?.invalid) {
                    <small class="text-red-500">発行日は必須です</small>
                  }
                </div>

                <!-- 支払期限 -->
                <div class="flex flex-col gap-1">
                  <label for="dueDate" class="font-medium text-sm" style="color: var(--p-text-color);">支払期限 <span class="text-red-500">*</span></label>
                  <p-datepicker
                      formControlName="dueDate"
                      inputId="dueDate"
                      dateFormat="yy/mm/dd"
                      [showIcon]="true"
                      styleClass="w-full"
                      data-testid="due-date-input" />
                  @if (form.get('dueDate')?.touched && form.get('dueDate')?.invalid) {
                    <small class="text-red-500">支払期限は必須です</small>
                  }
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- 消費税率 -->
                <div class="flex flex-col gap-1">
                  <label for="taxRate" class="font-medium text-sm" style="color: var(--p-text-color);">消費税率 (%) <span class="text-red-500">*</span></label>
                  <p-inputnumber
                      formControlName="taxRate"
                      inputId="taxRate"
                      [min]="0"
                      [max]="100"
                      suffix="%"
                      fluid
                      data-testid="tax-rate-input" />
                  @if (form.get('taxRate')?.touched && form.get('taxRate')?.invalid) {
                    <small class="text-red-500">消費税率は必須です</small>
                  }
                </div>

                <!-- 関連プロジェクト -->
                <div class="flex flex-col gap-1">
                  <label for="projectId" class="font-medium text-sm" style="color: var(--p-text-color);">関連プロジェクト (任意)</label>
                  <p-select
                      formControlName="projectId"
                      inputId="projectId"
                      [options]="projectOptions()"
                      optionLabel="name"
                      optionValue="id"
                      placeholder="なし"
                      [showClear]="true"
                      styleClass="w-full"
                      data-testid="project-select" />
                </div>
              </div>

              <!-- 備考 -->
              <div class="flex flex-col gap-1">
                <label for="notes" class="font-medium text-sm" style="color: var(--p-text-color);">備考 (任意)</label>
                <textarea pTextarea
                     formControlName="notes"
                     id="notes"
                     rows="3"
                     placeholder="振込先情報やその他の連絡事項を入力"
                     fluid
                     data-testid="notes-input"></textarea>
              </div>
            </div>
          </div>

          <!-- 明細行 -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <i class="pi pi-list" style="color: var(--p-text-muted-color);"></i>
                <h2 class="text-base font-bold m-0" style="color: var(--p-text-color);">請求明細</h2>
              </div>
              <p-button type="button"
                  icon="pi pi-plus"
                  label="明細を追加"
                  severity="secondary"
                  [outlined]="true"
                  size="small"
                  (onClick)="addItem()"
                  data-testid="add-item-btn" />
            </div>

            <p-table [value]="itemsDataSource" [tableStyle]="{ 'min-width': '40rem' }" data-testid="items-table">
              <ng-template #header>
                <tr>
                  <th class="w-60">項目名・詳細</th>
                  <th class="w-28">数量</th>
                  <th class="w-36">単価</th>
                  <th class="text-right w-36">金額</th>
                  <th class="w-14"></th>
                </tr>
              </ng-template>
              <ng-template #body let-row let-i="rowIndex">
                <tr data-testid="item-row">
                  <td>
                    <input pInputText
                        [formControl]="getItemControl(i, 'description')"
                        placeholder="例: システム開発費"
                        class="w-full p-inputtext-sm"
                        data-testid="item-description" />
                  </td>
                  <td>
                    <p-inputnumber
                        [formControl]="getItemControl(i, 'quantity')"
                        [min]="0"
                        inputStyleClass="w-full font-mono p-inputtext-sm"
                        data-testid="item-quantity" />
                  </td>
                  <td>
                    <p-inputnumber
                        [formControl]="getItemControl(i, 'unitPrice')"
                        [min]="0"
                        [step]="100"
                        inputStyleClass="w-full font-mono p-inputtext-sm"
                        data-testid="item-unit-price" />
                  </td>
                  <td class="text-right">
                    <span class="font-bold text-base font-mono" style="color: var(--p-text-color);">¥{{ getItemAmount(i) | number }}</span>
                  </td>
                  <td class="text-center">
                    <p-button type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        [text]="true"
                        size="small"
                        (onClick)="removeItem(i)"
                        [disabled]="items.length <= 1"
                        data-testid="remove-item-btn" />
                  </td>
                </tr>
              </ng-template>
            </p-table>

            <!-- 集計表示 -->
            <div class="p-6 border-t mt-4 rounded-b-2xl" style="background: var(--p-surface-50); border-color: var(--p-surface-200);" data-testid="totals">
              <div class="max-w-xs ml-auto space-y-3">
                <div class="flex justify-between items-center text-sm">
                  <span class="font-medium" style="color: var(--p-text-muted-color);">小計</span>
                  <span class="font-mono font-medium" style="color: var(--p-text-color);">¥{{ subtotal | number }}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span class="font-medium" style="color: var(--p-text-muted-color);">消費税 ({{ form.value.taxRate }}%)</span>
                  <span class="font-mono font-medium" style="color: var(--p-text-color);">¥{{ taxAmount | number }}</span>
                </div>
                <div class="border-t pt-3 mt-1 flex justify-between items-end" style="border-color: var(--p-surface-300);">
                  <span class="font-bold" style="color: var(--p-text-color);">合計金額</span>
                  <span class="text-2xl font-bold tracking-tight font-mono" style="color: var(--p-text-color);">¥{{ total | number }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- アクションボタン -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <p-button
              routerLink="/invoices"
              label="キャンセル"
              severity="secondary"
              [text]="true"
              data-testid="cancel-btn" />
            <p-button type="submit"
                [label]="isEdit ? '変更を保存' : '請求書を作成'"
                [disabled]="form.invalid || isSaving"
                [loading]="isSaving"
                styleClass="min-w-[120px]"
                data-testid="save-btn" />
          </div>
        </form>
      }
    </div>
  `,
  styles: [],
})
export class InvoiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private invoicesService = inject(InvoicesService);
  private http = inject(HttpClient);

  isEdit = false;
  isLoading = false;
  isSaving = false;
  invoiceId: string | null = null;
  projects = signal<ProjectItem[]>([]);

  /** p-select用のオプション */
  projectOptions = this.projects;

  form: FormGroup = this.fb.group({
    clientName: ['', Validators.required],
    issuedDate: [null as Date | null, Validators.required],
    dueDate: [null as Date | null, Validators.required],
    taxRate: [DEFAULT_TAX_RATE * 100, [Validators.required, Validators.min(0), Validators.max(100)]],
    projectId: [''],
    notes: [''],
    items: this.fb.array([this.createItemGroup()]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get itemsDataSource() {
    return this.items.controls;
  }

  get subtotal(): number {
    return this.items.controls.reduce((sum, ctrl) => {
      const qty = Number(ctrl.get('quantity')?.value) || 0;
      const price = Number(ctrl.get('unitPrice')?.value) || 0;
      return sum + qty * price;
    }, 0);
  }

  get taxAmount(): number {
    const rate = Number(this.form.get('taxRate')?.value) || 0;
    return Math.floor(this.subtotal * rate / 100);
  }

  get total(): number {
    return this.subtotal + this.taxAmount;
  }

  ngOnInit(): void {
    // プロジェクト一覧を取得
    this.http.get<any>('/api/projects').subscribe({
      next: (res) => {
        const list = Array.isArray(res.data) ? res.data
          : Array.isArray(res.data?.data) ? res.data.data
            : Array.isArray(res) ? res : [];
        this.projects.set(list.map((p: any) => ({
          id: p.id,
          name: p.name,
        })));
      },
      error: () => { },
    });

    this.invoiceId = this.route.snapshot.paramMap.get('id');
    if (this.invoiceId) {
      this.isEdit = true;
      this.isLoading = true;
      this.invoicesService.getById(this.invoiceId).subscribe((res) => {
        const data = res.success ? res.data : res;
        this.patchForm(data);
        this.isLoading = false;
      });
    }
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  getItemControl(index: number, field: string): any {
    return this.items.at(index).get(field);
  }

  getItemAmount(index: number): number {
    const ctrl = this.items.at(index);
    const qty = Number(ctrl.get('quantity')?.value) || 0;
    const price = Number(ctrl.get('unitPrice')?.value) || 0;
    return qty * price;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving = true;

    const value = this.form.value;

    // p-datepicker returns Date objects
    const formatDate = (d: any): string => {
      if (!d) return '';
      if (d instanceof Date) return d.toISOString().substring(0, 10);
      return String(d).substring(0, 10);
    };

    const dto = {
      clientName: value.clientName,
      issuedDate: formatDate(value.issuedDate),
      dueDate: formatDate(value.dueDate),
      taxRate: value.taxRate,
      projectId: value.projectId || undefined,
      notes: value.notes || undefined,
      items: value.items.map((item: any, i: number) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        sortOrder: i,
      })),
    };

    const obs = this.isEdit
      ? this.invoicesService.update(this.invoiceId!, dto)
      : this.invoicesService.create(dto);

    obs.subscribe({
      next: (res) => {
        const data = res.success ? res.data : res;
        this.router.navigate(['/invoices', data.id]);
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  private patchForm(invoice: any): void {
    // Convert dates to Date objects for p-datepicker
    const toDate = (d: any): Date | null => {
      if (!d) return null;
      return new Date(d);
    };

    this.form.patchValue({
      clientName: invoice.clientName,
      issuedDate: toDate(invoice.issuedDate),
      dueDate: toDate(invoice.dueDate),
      taxRate: Number(invoice.taxRate),
      projectId: invoice.projectId ?? '',
      notes: invoice.notes ?? '',
    });

    // Rebuild items FormArray
    this.items.clear();
    if (invoice.items?.length) {
      invoice.items.forEach((item: any) => {
        this.items.push(this.fb.group({
          description: [item.description, Validators.required],
          quantity: [Number(item.quantity), [Validators.required, Validators.min(0)]],
          unitPrice: [Number(item.unitPrice), [Validators.required, Validators.min(0)]],
        }));
      });
    } else {
      this.items.push(this.createItemGroup());
    }
  }
}
