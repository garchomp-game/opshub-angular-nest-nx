import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft, heroPlus, heroTrash,
  heroInformationCircle, heroListBullet,
} from '@ng-icons/heroicons/outline';
import { InvoicesService } from './invoices.service';
import { DEFAULT_TAX_RATE } from '@shared/types';
import { FormPageComponent, FormFieldComponent } from '../../shared/ui';

interface ProjectItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    NgIcon, FormPageComponent, FormFieldComponent,
  ],
  viewProviders: [provideIcons({
    heroArrowLeft, heroPlus, heroTrash,
    heroInformationCircle, heroListBullet,
  })],
  template: `
    <app-form-page [title]="isEdit ? '請求書を編集' : '新規請求書の作成'"
            subtitle="取引先への請求情報を入力してください">

      @if (isLoading) {
        <div class="flex justify-center items-center py-24" data-testid="loading">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-8" data-testid="invoice-form">
          <!-- 基本情報 -->
          <div>
            <div class="flex items-center gap-2 mb-5">
              <ng-icon name="heroInformationCircle" class="text-base-content/40" />
              <h2 class="text-base font-bold text-base-content m-0">基本情報</h2>
            </div>

            <div class="space-y-4">
              <app-form-field label="取引先名" [required]="true"
                      [errorMessage]="form.get('clientName')?.touched && form.get('clientName')?.invalid ? '取引先名は必須です' : ''">
                <input class="input w-full"
                    formControlName="clientName"
                    placeholder="例: 株式会社◯◯"
                    data-testid="client-name-input" />
              </app-form-field>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <app-form-field label="発行日" [required]="true"
                        [errorMessage]="form.get('issuedDate')?.touched && form.get('issuedDate')?.invalid ? '発行日は必須です' : ''">
                  <input type="date" class="input w-full"
                      formControlName="issuedDate"
                      data-testid="issued-date-input" />
                </app-form-field>

                <app-form-field label="支払期限" [required]="true"
                        [errorMessage]="form.get('dueDate')?.touched && form.get('dueDate')?.invalid ? '支払期限は必須です' : ''">
                  <input type="date" class="input w-full"
                      formControlName="dueDate"
                      data-testid="due-date-input" />
                </app-form-field>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <app-form-field label="消費税率 (%)" [required]="true"
                        [errorMessage]="form.get('taxRate')?.touched && form.get('taxRate')?.invalid ? '消費税率は必須です' : ''">
                  <input type="number" class="input w-full"
                      formControlName="taxRate"
                      placeholder="10"
                      min="0" max="100" step="1"
                      data-testid="tax-rate-input" />
                </app-form-field>

                <app-form-field label="関連プロジェクト (任意)">
                  <select class="select w-full"
                      formControlName="projectId"
                      data-testid="project-select">
                    <option value="">なし</option>
                    @for (p of projects(); track p.id) {
                      <option [value]="p.id">{{ p.name }}</option>
                    }
                  </select>
                </app-form-field>
              </div>

              <app-form-field label="備考 (任意)">
                <textarea class="textarea w-full"
                     formControlName="notes"
                     rows="3"
                     placeholder="振込先情報やその他の連絡事項を入力"
                     data-testid="notes-input"></textarea>
              </app-form-field>
            </div>
          </div>

          <!-- 明細行 -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <ng-icon name="heroListBullet" class="text-base-content/40" />
                <h2 class="text-base font-bold text-base-content m-0">請求明細</h2>
              </div>
              <button type="button" class="btn btn-outline btn-sm gap-1"
                  (click)="addItem()"
                  data-testid="add-item-btn">
                <ng-icon name="heroPlus" class="text-lg" />
                明細を追加
              </button>
            </div>

            <div class="overflow-x-auto" data-testid="items-table">
              <table class="table">
                <thead>
                  <tr>
                    <th class="w-60">項目名・詳細</th>
                    <th class="w-28">数量</th>
                    <th class="w-36">単価</th>
                    <th class="text-right w-36">金額</th>
                    <th class="w-14"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of itemsDataSource; track row; let i = $index) {
                    <tr data-testid="item-row">
                      <td>
                        <input class="input input-sm w-full"
                            [formControl]="getItemControl(i, 'description')"
                            placeholder="例: システム開発費"
                            data-testid="item-description" />
                      </td>
                      <td>
                        <input type="number" class="input input-sm w-full font-mono"
                            [formControl]="getItemControl(i, 'quantity')"
                            min="0" step="1"
                            data-testid="item-quantity" />
                      </td>
                      <td>
                        <input type="number" class="input input-sm w-full font-mono"
                            [formControl]="getItemControl(i, 'unitPrice')"
                            min="0" step="100"
                            data-testid="item-unit-price" />
                      </td>
                      <td class="text-right">
                        <span class="font-bold text-base-content text-base font-mono">¥{{ getItemAmount(i) | number }}</span>
                      </td>
                      <td class="text-center">
                        <button type="button"
                            class="btn btn-ghost btn-sm btn-square text-error"
                            (click)="removeItem(i)"
                            [disabled]="items.length <= 1"
                            data-testid="remove-item-btn">
                          <ng-icon name="heroTrash" class="text-lg" />
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- 集計表示 -->
            <div class="bg-base-200/50 p-6 border-t border-base-200 rounded-b-2xl mt-4" data-testid="totals">
              <div class="max-w-xs ml-auto space-y-3">
                <div class="flex justify-between items-center text-sm">
                  <span class="text-base-content/60 font-medium">小計</span>
                  <span class="font-mono text-base-content font-medium">¥{{ subtotal | number }}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-base-content/60 font-medium">消費税 ({{ form.value.taxRate }}%)</span>
                  <span class="font-mono text-base-content font-medium">¥{{ taxAmount | number }}</span>
                </div>
                <div class="border-t border-base-300 pt-3 mt-1 flex justify-between items-end">
                  <span class="text-base-content font-bold">合計金額</span>
                  <span class="text-2xl font-bold text-base-content tracking-tight font-mono">¥{{ total | number }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- アクションボタン -->
          <div slot="actions" class="flex items-center justify-end gap-3 pt-2">
            <a routerLink="/invoices" class="btn btn-ghost" data-testid="cancel-btn">
              キャンセル
            </a>
            <button type="submit" class="btn btn-primary min-w-[120px]"
                [disabled]="form.invalid || isSaving"
                data-testid="save-btn">
              @if (isSaving) {
                <span class="loading loading-spinner loading-sm"></span>
              }
              {{ isEdit ? '変更を保存' : '請求書を作成' }}
            </button>
          </div>
        </form>
      }
    </app-form-page>
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

  form: FormGroup = this.fb.group({
    clientName: ['', Validators.required],
    issuedDate: ['', Validators.required],
    dueDate: ['', Validators.required],
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

    // date input returns string 'YYYY-MM-DD'
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
    // Convert dates to 'YYYY-MM-DD' string for <input type="date">
    const toDateStr = (d: any): string => {
      if (!d) return '';
      const date = new Date(d);
      return date.toISOString().substring(0, 10);
    };

    this.form.patchValue({
      clientName: invoice.clientName,
      issuedDate: toDateStr(invoice.issuedDate),
      dueDate: toDateStr(invoice.dueDate),
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
