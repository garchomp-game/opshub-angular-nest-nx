import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorkflowService } from './workflow.service';

@Component({
    selector: 'app-workflow-form',
    standalone: true,
    imports: [
        CommonModule, RouterLink, ReactiveFormsModule,
        MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
        MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule,
        MatSnackBarModule, MatProgressSpinnerModule,
    ],
    template: `
        <div class="workflow-form-container">
            <div class="header">
                <a mat-button routerLink="/workflows">
                    <mat-icon>arrow_back</mat-icon> 一覧に戻る
                </a>
                <h1>{{ isEditMode ? '申請編集' : '新規申請' }}</h1>
            </div>

            <mat-card data-testid="workflow-form">
                <mat-card-content>
                    <form [formGroup]="form" class="form-grid">
                        <mat-form-field appearance="outline">
                            <mat-label>申請種別</mat-label>
                            <mat-select formControlName="type" data-testid="type-select">
                                <mat-option value="expense">経費</mat-option>
                                <mat-option value="leave">休暇</mat-option>
                                <mat-option value="purchase">購買</mat-option>
                                <mat-option value="other">その他</mat-option>
                            </mat-select>
                            <mat-error>申請種別を選択してください</mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>タイトル</mat-label>
                            <input matInput formControlName="title"
                                   maxlength="100"
                                   data-testid="title-input">
                            <mat-error>タイトルを入力してください（100文字以内）</mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="full-width">
                            <mat-label>説明</mat-label>
                            <textarea matInput formControlName="description"
                                      rows="4" maxlength="2000"
                                      data-testid="description-input"></textarea>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>金額</mat-label>
                            <input matInput type="number" formControlName="amount"
                                   data-testid="amount-input">
                            <span matPrefix>¥&nbsp;</span>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>承認者ID</mat-label>
                            <input matInput formControlName="approverId"
                                   data-testid="approver-input">
                            <mat-error>承認者を選択してください</mat-error>
                        </mat-form-field>
                    </form>
                </mat-card-content>

                <mat-card-actions align="end">
                    <button mat-button routerLink="/workflows" data-testid="cancel-btn">
                        キャンセル
                    </button>
                    <button mat-stroked-button
                            (click)="onSaveDraft()"
                            [disabled]="isSubmitting"
                            data-testid="save-draft-btn">
                        下書き保存
                    </button>
                    <button mat-raised-button color="primary"
                            (click)="onSubmit()"
                            [disabled]="form.invalid || isSubmitting"
                            data-testid="submit-btn">
                        <mat-icon>send</mat-icon> 送信
                    </button>
                </mat-card-actions>
            </mat-card>
        </div>
    `,
    styles: [`
        .workflow-form-container { padding: 24px; max-width: 700px; margin: 0 auto; }
        .header { margin-bottom: 16px; }
        .header h1 { margin: 8px 0 0; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px 0; }
        .full-width { grid-column: span 2; }
        mat-card-actions { padding: 16px; }
    `],
})
export class WorkflowFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private workflowService = inject(WorkflowService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private snackBar = inject(MatSnackBar);

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
                    this.snackBar.open('下書きを保存しました', '閉じる', { duration: 3000 });
                    this.router.navigate(['/workflows']);
                },
                error: () => { this.isSubmitting = false; },
            });
        } else {
            this.workflowService.create({ ...this.form.value, action: 'draft' }).subscribe({
                next: () => {
                    this.snackBar.open('下書きを保存しました', '閉じる', { duration: 3000 });
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
                            this.snackBar.open('申請を送信しました', '閉じる', { duration: 3000 });
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
                    this.snackBar.open('申請を送信しました', '閉じる', { duration: 3000 });
                    this.router.navigate(['/workflows']);
                },
                error: () => { this.isSubmitting = false; },
            });
        }
    }
}
