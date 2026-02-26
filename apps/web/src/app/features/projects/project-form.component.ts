import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectStatus, PROJECT_STATUS_LABELS } from '@shared/types';
import { ProjectService } from './project.service';

@Component({
    selector: 'app-project-form',
    standalone: true,
    imports: [
        RouterLink, ReactiveFormsModule,
        MatButtonModule, MatIconModule, MatFormFieldModule,
        MatInputModule, MatSelectModule, MatDatepickerModule,
        MatNativeDateModule, MatSnackBarModule, MatProgressSpinnerModule,
    ],
    template: `
        <div class="project-form-container">
            <div class="header">
                <a mat-button routerLink="/projects" data-testid="back-btn">
                    <mat-icon>arrow_back</mat-icon> 一覧に戻る
                </a>
                <h1>{{ isEdit() ? 'プロジェクト編集' : 'プロジェクト新規作成' }}</h1>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()"
                  class="form-content" data-testid="project-form">

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>プロジェクト名</mat-label>
                    <input matInput formControlName="name"
                           data-testid="name-input">
                    @if (form.get('name')?.hasError('required')) {
                        <mat-error>プロジェクト名は必須です</mat-error>
                    }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>説明</mat-label>
                    <textarea matInput formControlName="description"
                              rows="4" data-testid="description-input"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>PM ユーザーID</mat-label>
                    <input matInput formControlName="pmId"
                           data-testid="pm-input">
                    @if (form.get('pmId')?.hasError('required')) {
                        <mat-error>PM は必須です</mat-error>
                    }
                </mat-form-field>

                <div class="date-row">
                    <mat-form-field appearance="outline">
                        <mat-label>開始日</mat-label>
                        <input matInput [matDatepicker]="startPicker"
                               formControlName="startDate"
                               data-testid="start-date-input">
                        <mat-datepicker-toggle matSuffix [for]="startPicker" />
                        <mat-datepicker #startPicker />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                        <mat-label>終了日</mat-label>
                        <input matInput [matDatepicker]="endPicker"
                               formControlName="endDate"
                               data-testid="end-date-input">
                        <mat-datepicker-toggle matSuffix [for]="endPicker" />
                        <mat-datepicker #endPicker />
                    </mat-form-field>
                </div>

                <div class="actions">
                    <a mat-button routerLink="/projects">キャンセル</a>
                    <button mat-raised-button color="primary"
                            type="submit"
                            [disabled]="form.invalid || submitting()"
                            data-testid="submit-btn">
                        @if (submitting()) {
                            <mat-progress-spinner mode="indeterminate"
                                                  diameter="20" />
                        } @else {
                            {{ isEdit() ? '更新' : '作成' }}
                        }
                    </button>
                </div>
            </form>
        </div>
    `,
    styles: [`
        .project-form-container { padding: 24px; max-width: 640px; }
        .header { margin-bottom: 24px; }
        .form-content { display: flex; flex-direction: column; gap: 8px; }
        .full-width { width: 100%; }
        .date-row { display: flex; gap: 16px; }
        .date-row mat-form-field { flex: 1; }
        .actions {
            display: flex; justify-content: flex-end;
            gap: 8px; margin-top: 16px;
        }
    `],
})
export class ProjectFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private snackBar = inject(MatSnackBar);
    private projectService = inject(ProjectService);

    isEdit = signal(false);
    submitting = signal(false);
    private projectId = '';

    form: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        description: [''],
        pmId: ['', [Validators.required]],
        startDate: [null],
        endDate: [null],
    });

    ngOnInit() {
        this.projectId = this.route.snapshot.paramMap.get('id') ?? '';
        if (this.projectId) {
            this.isEdit.set(true);
            this.projectService.getById(this.projectId).subscribe((res) => {
                if (res.success) {
                    this.form.patchValue({
                        name: res.data.name,
                        description: res.data.description,
                        pmId: res.data.pmId,
                        startDate: res.data.startDate,
                        endDate: res.data.endDate,
                    });
                }
            });
        }
    }

    onSubmit() {
        if (this.form.invalid) return;
        this.submitting.set(true);

        const value = this.form.value;
        const dto = {
            name: value.name,
            description: value.description || undefined,
            pmId: value.pmId,
            startDate: value.startDate
                ? new Date(value.startDate).toISOString().split('T')[0]
                : undefined,
            endDate: value.endDate
                ? new Date(value.endDate).toISOString().split('T')[0]
                : undefined,
        };

        const obs = this.isEdit()
            ? this.projectService.update(this.projectId, dto)
            : this.projectService.create(dto);

        obs.subscribe({
            next: () => {
                this.snackBar.open(
                    this.isEdit() ? '更新しました' : '作成しました',
                    '閉じる',
                    { duration: 3000 },
                );
                this.router.navigate(['/projects']);
            },
            error: () => this.submitting.set(false),
        });
    }
}
