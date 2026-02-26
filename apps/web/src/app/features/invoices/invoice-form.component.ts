import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvoicesService } from './invoices.service';
import { DEFAULT_TAX_RATE } from '@shared/types';

@Component({
    selector: 'app-invoice-form',
    standalone: true,
    imports: [
        CommonModule, RouterLink, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatButtonModule,
        MatIconModule, MatDatepickerModule, MatNativeDateModule,
        MatCardModule, MatTableModule, MatProgressSpinnerModule,
    ],
    template: `
        <div class="invoice-form-container">
            <div class="header">
                <h1>{{ isEdit ? '請求書編集' : '新規請求書' }}</h1>
            </div>

            @if (isLoading) {
                <div class="loading-container" data-testid="loading">
                    <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
                </div>
            } @else {
                <form [formGroup]="form" (ngSubmit)="onSubmit()" data-testid="invoice-form">
                    <mat-card class="form-card">
                        <mat-card-content>
                            <div class="form-row">
                                <mat-form-field class="full-width">
                                    <mat-label>取引先名</mat-label>
                                    <input matInput formControlName="clientName"
                                           data-testid="client-name-input">
                                </mat-form-field>
                            </div>
                            <div class="form-row two-col">
                                <mat-form-field>
                                    <mat-label>発行日</mat-label>
                                    <input matInput formControlName="issuedDate" type="date"
                                           data-testid="issued-date-input">
                                </mat-form-field>
                                <mat-form-field>
                                    <mat-label>支払期限</mat-label>
                                    <input matInput formControlName="dueDate" type="date"
                                           data-testid="due-date-input">
                                </mat-form-field>
                            </div>
                            <div class="form-row two-col">
                                <mat-form-field>
                                    <mat-label>税率 (%)</mat-label>
                                    <input matInput type="number" formControlName="taxRate"
                                           data-testid="tax-rate-input">
                                </mat-form-field>
                                <mat-form-field>
                                    <mat-label>プロジェクトID (任意)</mat-label>
                                    <input matInput formControlName="projectId"
                                           data-testid="project-id-input">
                                </mat-form-field>
                            </div>
                            <mat-form-field class="full-width">
                                <mat-label>備考</mat-label>
                                <textarea matInput formControlName="notes" rows="3"
                                          data-testid="notes-input"></textarea>
                            </mat-form-field>
                        </mat-card-content>
                    </mat-card>

                    <!-- Items -->
                    <mat-card class="items-card">
                        <mat-card-header>
                            <mat-card-title>明細行</mat-card-title>
                        </mat-card-header>
                        <mat-card-content>
                            <table mat-table [dataSource]="itemsDataSource" class="items-table"
                                   data-testid="items-table">
                                <ng-container matColumnDef="description">
                                    <th mat-header-cell *matHeaderCellDef>説明</th>
                                    <td mat-cell *matCellDef="let row; let i = index">
                                        <mat-form-field class="full-width compact">
                                            <input matInput [formControl]="getItemControl(i, 'description')"
                                                   data-testid="item-description">
                                        </mat-form-field>
                                    </td>
                                </ng-container>
                                <ng-container matColumnDef="quantity">
                                    <th mat-header-cell *matHeaderCellDef>数量</th>
                                    <td mat-cell *matCellDef="let row; let i = index">
                                        <mat-form-field class="compact narrow">
                                            <input matInput type="number"
                                                   [formControl]="getItemControl(i, 'quantity')"
                                                   data-testid="item-quantity">
                                        </mat-form-field>
                                    </td>
                                </ng-container>
                                <ng-container matColumnDef="unitPrice">
                                    <th mat-header-cell *matHeaderCellDef>単価</th>
                                    <td mat-cell *matCellDef="let row; let i = index">
                                        <mat-form-field class="compact narrow">
                                            <input matInput type="number"
                                                   [formControl]="getItemControl(i, 'unitPrice')"
                                                   data-testid="item-unit-price">
                                        </mat-form-field>
                                    </td>
                                </ng-container>
                                <ng-container matColumnDef="amount">
                                    <th mat-header-cell *matHeaderCellDef>金額</th>
                                    <td mat-cell *matCellDef="let row; let i = index" class="text-right">
                                        ¥{{ getItemAmount(i) | number }}
                                    </td>
                                </ng-container>
                                <ng-container matColumnDef="actions">
                                    <th mat-header-cell *matHeaderCellDef></th>
                                    <td mat-cell *matCellDef="let row; let i = index">
                                        <button mat-icon-button color="warn" type="button"
                                                (click)="removeItem(i)"
                                                [disabled]="items.length <= 1"
                                                data-testid="remove-item-btn">
                                            <mat-icon>delete</mat-icon>
                                        </button>
                                    </td>
                                </ng-container>

                                <tr mat-header-row *matHeaderRowDef="itemColumns"></tr>
                                <tr mat-row *matRowDef="let row; columns: itemColumns;"
                                    data-testid="item-row"></tr>
                            </table>

                            <button mat-stroked-button type="button" (click)="addItem()"
                                    class="add-item-btn" data-testid="add-item-btn">
                                <mat-icon>add</mat-icon> 明細行を追加
                            </button>

                            <!-- Totals -->
                            <div class="totals" data-testid="totals">
                                <div class="total-row">
                                    <span>小計:</span>
                                    <span>¥{{ subtotal | number }}</span>
                                </div>
                                <div class="total-row">
                                    <span>消費税 ({{ form.value.taxRate }}%):</span>
                                    <span>¥{{ taxAmount | number }}</span>
                                </div>
                                <div class="total-row grand-total">
                                    <span>合計:</span>
                                    <span>¥{{ total | number }}</span>
                                </div>
                            </div>
                        </mat-card-content>
                    </mat-card>

                    <!-- Actions -->
                    <div class="actions">
                        <a mat-button routerLink="/invoices" data-testid="cancel-btn">キャンセル</a>
                        <button mat-raised-button color="primary" type="submit"
                                [disabled]="form.invalid || isSaving"
                                data-testid="save-btn">
                            {{ isSaving ? '保存中...' : '保存' }}
                        </button>
                    </div>
                </form>
            }
        </div>
    `,
    styles: [`
        .invoice-form-container { padding: 24px; max-width: 960px; margin: 0 auto; }
        .header { margin-bottom: 16px; }
        .form-card, .items-card { margin-bottom: 16px; }
        .form-row { margin-bottom: 8px; }
        .two-col { display: flex; gap: 16px; }
        .two-col mat-form-field { flex: 1; }
        .full-width { width: 100%; }
        .compact { font-size: 14px; }
        .narrow { width: 120px; }
        .items-table { width: 100%; margin-bottom: 16px; }
        .add-item-btn { margin-bottom: 16px; }
        .text-right { text-align: right; }
        .totals { border-top: 1px solid #ddd; padding-top: 16px; }
        .total-row { display: flex; justify-content: flex-end; gap: 24px; padding: 4px 0; }
        .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 8px; margin-top: 4px; }
        .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
        .loading-container { display: flex; justify-content: center; padding: 48px; }
    `],
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

    itemColumns = ['description', 'quantity', 'unitPrice', 'amount', 'actions'];

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
        const dto = {
            clientName: value.clientName,
            issuedDate: value.issuedDate,
            dueDate: value.dueDate,
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
            issuedDate: invoice.issuedDate?.substring(0, 10),
            dueDate: invoice.dueDate?.substring(0, 10),
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
