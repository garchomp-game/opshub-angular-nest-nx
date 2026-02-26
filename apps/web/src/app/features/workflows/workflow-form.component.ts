import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WorkflowService } from './workflow.service';

@Component({
    selector: 'app-workflow-form',
    standalone: true,
    imports: [
        CommonModule, RouterLink, ReactiveFormsModule,
        NzCardModule, NzFormModule, NzInputModule, NzSelectModule,
        NzButtonModule, NzIconModule, NzDatePickerModule, NzSpinModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            <div class="flex items-center gap-3 border-b border-gray-200 pb-4">
                <button nz-button nzShape="circle" routerLink="/workflows">
                    <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
                </button>
                <h1 class="text-2xl font-bold text-gray-900 m-0">{{ isEditMode ? '申請編集' : '新規申請' }}</h1>
            </div>

            <nz-card data-testid="workflow-form">
                <form nz-form [formGroup]="form" nzLayout="vertical">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <nz-form-item>
                            <nz-form-label nzRequired nzFor="type">申請種別</nz-form-label>
                            <nz-form-control nzErrorTip="申請種別を選択してください">
                                <nz-select formControlName="type"
                                           nzPlaceHolder="種別を選択"
                                           id="type"
                                           data-testid="type-select">
                                    <nz-option nzValue="expense" nzLabel="経費"></nz-option>
                                    <nz-option nzValue="leave" nzLabel="休暇"></nz-option>
                                    <nz-option nzValue="purchase" nzLabel="購買"></nz-option>
                                    <nz-option nzValue="other" nzLabel="その他"></nz-option>
                                </nz-select>
                            </nz-form-control>
                        </nz-form-item>

                        <nz-form-item>
                            <nz-form-label nzRequired nzFor="title">タイトル</nz-form-label>
                            <nz-form-control nzErrorTip="タイトルを入力してください（100文字以内）">
                                <input nz-input formControlName="title" id="title"
                                       maxlength="100" placeholder="タイトルを入力"
                                       data-testid="title-input" />
                            </nz-form-control>
                        </nz-form-item>

                        <nz-form-item class="md:col-span-2">
                            <nz-form-label nzFor="description">説明</nz-form-label>
                            <nz-form-control>
                                <nz-textarea-count [nzMaxCharacterCount]="2000">
                                    <textarea nz-input formControlName="description" id="description"
                                              rows="4" placeholder="詳細を入力"
                                              data-testid="description-input"></textarea>
                                </nz-textarea-count>
                            </nz-form-control>
                        </nz-form-item>

                        <nz-form-item>
                            <nz-form-label nzFor="amount">金額</nz-form-label>
                            <nz-form-control>
                                <nz-input-group nzPrefix="¥">
                                    <input nz-input type="number" formControlName="amount" id="amount"
                                           placeholder="金額を入力"
                                           data-testid="amount-input" />
                                </nz-input-group>
                            </nz-form-control>
                        </nz-form-item>

                        <nz-form-item>
                            <nz-form-label nzRequired nzFor="approverId">承認者ID</nz-form-label>
                            <nz-form-control nzErrorTip="承認者を選択してください">
                                <input nz-input formControlName="approverId" id="approverId"
                                       placeholder="承認者IDを入力"
                                       data-testid="approver-input" />
                            </nz-form-control>
                        </nz-form-item>
                    </div>

                    <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                        <button nz-button routerLink="/workflows" data-testid="cancel-btn">
                            キャンセル
                        </button>
                        <button nz-button
                                (click)="onSaveDraft()" [disabled]="isSubmitting" data-testid="save-draft-btn">
                            下書き保存
                        </button>
                        <button nz-button nzType="primary"
                                (click)="onSubmit()" [disabled]="form.invalid || isSubmitting" data-testid="submit-btn">
                            <span nz-icon nzType="send" nzTheme="outline"></span>
                            送信する
                        </button>
                    </div>
                </form>
            </nz-card>
        </div>
    `,
    styles: [],
})
export class WorkflowFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private workflowService = inject(WorkflowService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private message = inject(NzMessageService);

    form: FormGroup;
    isEditMode = false;
    isSubmitting = false;
    private editId: string | null = null;

    constructor() {
        this.form = this.fb.group({
            type: ['', Validators.required],
            title: ['', [Validators.required, Validators.maxLength(100)]],
            description: [''],
            amount: [null],
            approverId: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        this.editId = this.route.snapshot.paramMap.get('id');
        if (this.editId) {
            this.isEditMode = true;
            this.workflowService.getById(this.editId).subscribe((res) => {
                const data = res.success ? res.data : res;
                this.form.patchValue({
                    type: data.type,
                    title: data.title,
                    description: data.description,
                    amount: data.amount,
                    approverId: data.approverId,
                });
            });
        }
    }

    onSaveDraft(): void {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        if (this.isEditMode && this.editId) {
            this.workflowService.update(this.editId, this.form.value).subscribe({
                next: () => {
                    this.message.success('下書きを保存しました');
                    this.router.navigate(['/workflows']);
                },
                error: () => { this.isSubmitting = false; },
            });
        } else {
            this.workflowService.create({ ...this.form.value, action: 'draft' }).subscribe({
                next: () => {
                    this.message.success('下書きを保存しました');
                    this.router.navigate(['/workflows']);
                },
                error: () => { this.isSubmitting = false; },
            });
        }
    }

    onSubmit(): void {
        if (this.form.invalid || this.isSubmitting) return;
        this.isSubmitting = true;

        if (this.isEditMode && this.editId) {
            // Update then submit
            this.workflowService.update(this.editId, this.form.value).subscribe({
                next: () => {
                    this.workflowService.submit(this.editId!).subscribe({
                        next: () => {
                            this.message.success('申請を送信しました');
                            this.router.navigate(['/workflows']);
                        },
                        error: () => { this.isSubmitting = false; },
                    });
                },
                error: () => { this.isSubmitting = false; },
            });
        } else {
            this.workflowService.create({ ...this.form.value, action: 'submit' }).subscribe({
                next: () => {
                    this.message.success('申請を送信しました');
                    this.router.navigate(['/workflows']);
                },
                error: () => { this.isSubmitting = false; },
            });
        }
    }
}
