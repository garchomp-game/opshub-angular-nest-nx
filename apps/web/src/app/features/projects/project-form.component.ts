import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ProjectStatus, PROJECT_STATUS_LABELS } from '@shared/types';
import { ProjectService } from './project.service';

@Component({
    selector: 'app-project-form',
    standalone: true,
    imports: [
        RouterLink, ReactiveFormsModule,
        NzFormModule, NzInputModule, NzButtonModule,
        NzIconModule, NzDatePickerModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            <div class="flex items-center gap-3 border-b border-gray-200 pb-4">
                <button nz-button nzType="default" nzShape="circle" routerLink="/projects" data-testid="back-btn">
                    <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
                </button>
                <h1 class="text-2xl font-bold text-gray-900 m-0">{{ isEdit() ? 'プロジェクト編集' : 'プロジェクト新規作成' }}</h1>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <form nz-form [formGroup]="form" (ngSubmit)="onSubmit()"
                      nzLayout="vertical" class="p-6 md:p-8" data-testid="project-form">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        <nz-form-item class="md:col-span-2">
                            <nz-form-label nzFor="name" nzRequired>プロジェクト名</nz-form-label>
                            <nz-form-control nzErrorTip="プロジェクト名は必須です">
                                <input nz-input formControlName="name" id="name"
                                       placeholder="プロジェクト名を入力" data-testid="name-input" />
                            </nz-form-control>
                        </nz-form-item>

                        <nz-form-item class="md:col-span-2">
                            <nz-form-label nzFor="description">説明</nz-form-label>
                            <nz-form-control>
                                <textarea nz-input formControlName="description" id="description"
                                          [nzAutosize]="{ minRows: 4, maxRows: 8 }"
                                          placeholder="プロジェクトの説明"
                                          data-testid="description-input"></textarea>
                            </nz-form-control>
                        </nz-form-item>

                        <nz-form-item class="md:col-span-2">
                            <nz-form-label nzFor="pmId" nzRequired>PM ユーザーID</nz-form-label>
                            <nz-form-control nzErrorTip="PM は必須です">
                                <input nz-input formControlName="pmId" id="pmId"
                                       placeholder="PM ユーザーIDを入力" data-testid="pm-input" />
                            </nz-form-control>
                        </nz-form-item>

                        <nz-form-item>
                            <nz-form-label nzFor="startDate">開始日</nz-form-label>
                            <nz-form-control>
                                <nz-date-picker formControlName="startDate"
                                                class="w-full"
                                                nzPlaceHolder="開始日を選択"
                                                data-testid="start-date-input"></nz-date-picker>
                            </nz-form-control>
                        </nz-form-item>

                        <nz-form-item>
                            <nz-form-label nzFor="endDate">終了日</nz-form-label>
                            <nz-form-control>
                                <nz-date-picker formControlName="endDate"
                                                class="w-full"
                                                nzPlaceHolder="終了日を選択"
                                                data-testid="end-date-input"></nz-date-picker>
                            </nz-form-control>
                        </nz-form-item>
                    </div>

                    <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                        <a nz-button nzType="default" routerLink="/projects">キャンセル</a>
                        <button nz-button nzType="primary" type="submit"
                                [disabled]="form.invalid || submitting()"
                                [nzLoading]="submitting()"
                                data-testid="submit-btn">
                            {{ isEdit() ? '更新' : '作成' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `,
    styles: [`
        ::ng-deep .ant-form-vertical .ant-form-item {
            margin-bottom: 16px;
        }
    `],
})
export class ProjectFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private message = inject(NzMessageService);
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
                this.message.success(
                    this.isEdit() ? '更新しました' : '作成しました',
                );
                this.router.navigate(['/projects']);
            },
            error: () => this.submitting.set(false),
        });
    }
}
