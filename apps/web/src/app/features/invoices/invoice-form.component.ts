import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { InvoicesService } from './invoices.service';
import { DEFAULT_TAX_RATE } from '@shared/types';

@Component({
    selector: 'app-invoice-form',
    standalone: true,
    imports: [
        CommonModule, RouterLink, ReactiveFormsModule,
        NzFormModule, NzInputModule, NzInputNumberModule,
        NzButtonModule, NzIconModule, NzDatePickerModule,
        NzCardModule, NzTableModule, NzSpinModule, NzDividerModule,
    ],
    template: `
        <div class="min-h-[calc(100vh-64px)] bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div class="max-w-4xl mx-auto">
                <div class="mb-6 flex items-center gap-4">
                    <button nz-button nzType="default" nzShape="circle" routerLink="/invoices"
                            class="shadow-sm"
                            data-testid="back-btn">
                        <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
                    </button>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 m-0 tracking-tight">{{ isEdit ? '請求書を編集' : '新規請求書の作成' }}</h1>
                        <p class="text-gray-500 mt-1 mb-0 text-sm">取引先への請求情報を入力してください</p>
                    </div>
                </div>

                @if (isLoading) {
                    <div class="flex justify-center items-center py-24" data-testid="loading">
                        <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                    </div>
                } @else {
                    <form nz-form [formGroup]="form" (ngSubmit)="onSubmit()" nzLayout="vertical" class="space-y-6" data-testid="invoice-form">
                        <!-- 基本情報 -->
                        <nz-card class="!rounded-2xl shadow-sm border border-gray-100 overflow-hidden" [nzBordered]="false">
                            <div class="flex items-center gap-2 mb-5">
                                <span nz-icon nzType="info-circle" nzTheme="outline" class="text-gray-400"></span>
                                <h2 class="text-base font-bold text-gray-900 m-0">基本情報</h2>
                            </div>

                            <nz-form-item>
                                <nz-form-label nzRequired>取引先名</nz-form-label>
                                <nz-form-control nzErrorTip="取引先名は必須です">
                                    <nz-input-group nzPrefixIcon="shop">
                                        <input nz-input formControlName="clientName" placeholder="例: 株式会社◯◯" data-testid="client-name-input" />
                                    </nz-input-group>
                                </nz-form-control>
                            </nz-form-item>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <nz-form-item>
                                    <nz-form-label nzRequired>発行日</nz-form-label>
                                    <nz-form-control nzErrorTip="発行日は必須です">
                                        <nz-date-picker formControlName="issuedDate"
                                                        nzFormat="yyyy/MM/dd"
                                                        class="w-full"
                                                        data-testid="issued-date-input">
                                        </nz-date-picker>
                                    </nz-form-control>
                                </nz-form-item>
                                
                                <nz-form-item>
                                    <nz-form-label nzRequired>支払期限</nz-form-label>
                                    <nz-form-control nzErrorTip="支払期限は必須です">
                                        <nz-date-picker formControlName="dueDate"
                                                        nzFormat="yyyy/MM/dd"
                                                        class="w-full"
                                                        data-testid="due-date-input">
                                        </nz-date-picker>
                                    </nz-form-control>
                                </nz-form-item>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <nz-form-item>
                                    <nz-form-label nzRequired>消費税率 (%)</nz-form-label>
                                    <nz-form-control nzErrorTip="消費税率は必須です">
                                        <nz-input-number formControlName="taxRate"
                                                         [nzMin]="0" [nzMax]="100" [nzStep]="1"
                                                         nzPlaceHolder="10"
                                                         class="!w-full"
                                                         data-testid="tax-rate-input">
                                        </nz-input-number>
                                    </nz-form-control>
                                </nz-form-item>
                                
                                <nz-form-item>
                                    <nz-form-label>プロジェクトID (任意)</nz-form-label>
                                    <nz-form-control>
                                        <nz-input-group nzPrefixIcon="project">
                                            <input nz-input formControlName="projectId" placeholder="PROJ-001" data-testid="project-id-input" />
                                        </nz-input-group>
                                    </nz-form-control>
                                </nz-form-item>
                            </div>
                            
                            <nz-form-item>
                                <nz-form-label>備考 (任意)</nz-form-label>
                                <nz-form-control>
                                    <textarea nz-input formControlName="notes" [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                                              placeholder="振込先情報やその他の連絡事項を入力" data-testid="notes-input"></textarea>
                                </nz-form-control>
                            </nz-form-item>
                        </nz-card>

                        <!-- 明細行 -->
                        <nz-card class="!rounded-2xl shadow-sm border border-gray-100 overflow-hidden" [nzBordered]="false">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center gap-2">
                                    <span nz-icon nzType="unordered-list" nzTheme="outline" class="text-gray-400"></span>
                                    <h2 class="text-base font-bold text-gray-900 m-0">請求明細</h2>
                                </div>
                                <button nz-button nzType="dashed" type="button" (click)="addItem()" data-testid="add-item-btn">
                                    <span nz-icon nzType="plus" nzTheme="outline"></span>
                                    <span class="font-medium text-sm">明細を追加</span>
                                </button>
                            </div>
                            
                            <nz-table
                                #itemsTable
                                [nzData]="itemsDataSource"
                                [nzShowPagination]="false"
                                [nzBordered]="false"
                                nzSize="middle"
                                data-testid="items-table">
                                <thead>
                                    <tr>
                                        <th nzWidth="240px">項目名・詳細</th>
                                        <th nzWidth="110px">数量</th>
                                        <th nzWidth="150px">単価</th>
                                        <th nzAlign="right" nzWidth="140px">金額</th>
                                        <th nzWidth="60px"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (row of itemsTable.data; track row; let i = $index) {
                                        <tr data-testid="item-row">
                                            <td>
                                                <input nz-input [formControl]="getItemControl(i, 'description')"
                                                       placeholder="例: システム開発費" data-testid="item-description" />
                                            </td>
                                            <td>
                                                <nz-input-number [formControl]="getItemControl(i, 'quantity')"
                                                                 [nzMin]="0" [nzStep]="1"
                                                                 class="!w-full"
                                                                 data-testid="item-quantity">
                                                </nz-input-number>
                                            </td>
                                            <td>
                                                <nz-input-number [formControl]="getItemControl(i, 'unitPrice')"
                                                                 [nzMin]="0" [nzStep]="100"
                                                                 [nzFormatter]="priceFormatter"
                                                                 [nzParser]="priceParser"
                                                                 class="!w-full"
                                                                 data-testid="item-unit-price">
                                                </nz-input-number>
                                            </td>
                                            <td class="text-right">
                                                <span class="font-bold text-gray-900 text-base">¥{{ getItemAmount(i) | number }}</span>
                                            </td>
                                            <td class="text-center">
                                                <button nz-button nzType="text" nzDanger nzSize="small"
                                                        type="button"
                                                        (click)="removeItem(i)"
                                                        [disabled]="items.length <= 1"
                                                        class="opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
                                                        data-testid="remove-item-btn">
                                                    <span nz-icon nzType="delete" nzTheme="outline"></span>
                                                </button>
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </nz-table>

                            <!-- 集計表示 -->
                            <div class="bg-gray-50/80 p-6 border-t border-gray-100 -mx-6 -mb-6 mt-4" data-testid="totals">
                                <div class="max-w-xs ml-auto space-y-3">
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-gray-500 font-medium">小計</span>
                                        <span class="font-mono text-gray-900 font-medium">¥{{ subtotal | number }}</span>
                                    </div>
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-gray-500 font-medium">消費税 ({{ form.value.taxRate }}%)</span>
                                        <span class="font-mono text-gray-900 font-medium">¥{{ taxAmount | number }}</span>
                                    </div>
                                    <div class="border-t border-gray-200 pt-3 mt-1 flex justify-between items-end">
                                        <span class="text-gray-900 font-bold">合計金額</span>
                                        <span class="text-2xl font-bold text-gray-900 tracking-tight">¥{{ total | number }}</span>
                                    </div>
                                </div>
                            </div>
                        </nz-card>

                        <!-- アクションボタン -->
                        <div class="flex items-center justify-end gap-3 pt-2">
                            <a nz-button nzType="default" routerLink="/invoices" data-testid="cancel-btn">
                                キャンセル
                            </a>
                            <button nz-button nzType="primary" type="submit"
                                    [disabled]="form.invalid || isSaving"
                                    [nzLoading]="isSaving"
                                    class="!rounded-lg shadow-sm font-bold min-w-[120px]"
                                    data-testid="save-btn">
                                {{ isEdit ? '変更を保存' : '請求書を作成' }}
                            </button>
                        </div>
                    </form>
                }
            </div>
        </div>
    `,
    styles: [],
})
export class InvoiceFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private invoicesService = inject(InvoicesService);

    isEdit = false;
    isLoading = false;
    isSaving = false;
    invoiceId: string | null = null;

    // Formatters for nz-input-number
    priceFormatter = (value: number): string => `¥ ${value}`;
    priceParser = (value: string): number => Number(value.replace(/¥\s?/g, '')) || 0;

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

        // nz-date-picker returns Date objects; convert to ISO string
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
        this.form.patchValue({
            clientName: invoice.clientName,
            issuedDate: invoice.issuedDate ? new Date(invoice.issuedDate) : null,
            dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
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
