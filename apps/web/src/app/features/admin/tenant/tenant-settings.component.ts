import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { AdminTenantService, ExportTenantDto } from '../services/tenant.service';
import { ToastService } from '../../../shared/services/toast.service';

const EXPORT_TABLES = [
  { label: 'ユーザー', value: 'users' },
  { label: 'プロジェクト', value: 'projects' },
  { label: 'ワークフロー', value: 'workflows' },
  { label: '工数', value: 'timesheets' },
  { label: '経費', value: 'expenses' },
];

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    ProgressBarModule,
    SelectButtonModule,
    CheckboxModule,
  ],
  template: `
  <div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6" data-testid="tenant-settings">
    <div class="mb-2">
      <h1 class="text-2xl font-bold m-0">テナント設定</h1>
      <p class="mt-1 text-sm" style="color: var(--p-text-muted-color)">システム全体の基本情報や危険な操作の管理を行います。</p>
    </div>

    @if (tenantService.loading()) {
      <div class="flex justify-center items-center py-24" data-testid="loading">
        <p-progressspinner strokeWidth="4" />
      </div>
    } @else if (tenantService.tenant()) {
      <p-card>
        <form [formGroup]="form" (ngSubmit)="onSave()" data-testid="tenant-form" class="space-y-4">
          <div class="flex flex-col gap-2">
            <label for="tenant-name" class="font-medium text-sm">組織名 <span class="text-red-500">*</span></label>
            <input pInputText id="tenant-name"
                formControlName="name" placeholder="株式会社〇〇"
                class="w-full"
                data-testid="tenant-name-input">
          </div>

          <div class="flex justify-end mt-4">
            <p-button label="保存する" icon="pi pi-cog" type="submit"
                [disabled]="!form.dirty"
                data-testid="save-btn" />
          </div>
        </form>
      </p-card>

      <!-- データエクスポート (GDPR) -->
      <div data-testid="export-section">
      <p-card>
        <h3 class="text-base font-bold m-0 mb-4">データエクスポート</h3>
        <p class="text-sm mb-4" style="color: var(--p-text-muted-color)">
          GDPR データポータビリティ対応。テナントデータを JSON または CSV 形式でダウンロードできます。
        </p>

        <div class="space-y-4">
          <!-- フォーマット選択 -->
          <div class="flex flex-col gap-2">
            <span id="format-label" class="font-medium text-sm">フォーマット</span>
            <p-selectbutton [attr.aria-labelledby]="'format-label'"
              [options]="formatOptions"
              [(ngModel)]="selectedFormat"
              [ngModelOptions]="{ standalone: true }"
              data-testid="format-select" />
          </div>

          <!-- テーブル選択 -->
          <div class="flex flex-col gap-2">
            <span id="export-target-label" class="font-medium text-sm">エクスポート対象</span>
            <div class="flex flex-wrap gap-4">
              @for (table of exportTables; track table.value) {
                <div class="flex items-center gap-2">
                  <p-checkbox
                    [value]="table.value"
                    [(ngModel)]="selectedTables"
                    [ngModelOptions]="{ standalone: true }"
                    [inputId]="'export-' + table.value"
                    [attr.data-testid]="'checkbox-' + table.value" />
                  <label [for]="'export-' + table.value" class="text-sm">{{ table.label }}</label>
                </div>
              }
            </div>
          </div>

          <!-- 進捗バー -->
          @if (tenantService.exporting()) {
            <div data-testid="export-progress">
              <p-progressbar
                [value]="tenantService.exportStatus()?.progress ?? 0"
                [showValue]="true" />
              <p class="text-xs mt-1" style="color: var(--p-text-muted-color)">
                ステータス: {{ tenantService.exportStatus()?.status ?? '準備中' }}
              </p>
            </div>
          }

          <!-- アクションボタン -->
          <div class="flex gap-2">
            <div data-testid="export-btn">
            <p-button
              label="エクスポート開始"
              icon="pi pi-download"
              [disabled]="selectedTables.length === 0 || tenantService.exporting()"
              [loading]="tenantService.exporting()"
              (onClick)="onExport()" />
            </div>

            @if (tenantService.exportStatus()?.status === 'completed') {
              <div data-testid="download-btn">
              <p-button
                label="ダウンロード"
                icon="pi pi-file"
                severity="success"
                (onClick)="onDownload()" />
              </div>
            }
          </div>
        </div>
      </p-card>
      </div>

      <!-- 危険な操作 -->
      <p-card styleClass="border-red-300" [style]="{ 'border': '1px solid var(--p-red-300)' }">
        <h3 class="text-base font-bold m-0 mb-4" style="color: var(--p-red-500)">危険な操作</h3>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 class="font-bold mb-1 m-0">テナントの削除</h4>
            <p class="text-sm leading-relaxed m-0" style="color: var(--p-text-muted-color)">
              このテナントと、関連するすべてのプロジェクト、タスク、ユーザーデータが完全に削除されます。
              <br class="hidden sm:block">この操作は取り消すことができません。
            </p>
          </div>
          <p-button label="テナント削除" icon="pi pi-trash" severity="danger"
              (onClick)="onDelete()"
              data-testid="delete-btn" />
        </div>
      </p-card>
    }
  </div>
 `,
  styles: [],
})
export class TenantSettingsComponent implements OnInit {
  tenantService = inject(AdminTenantService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  form: FormGroup = this.fb.group({
    name: [''],
  });

  // Export state
  formatOptions = [
    { label: 'JSON', value: 'json' },
    { label: 'CSV', value: 'csv' },
  ];
  exportTables = EXPORT_TABLES;
  selectedFormat: 'json' | 'csv' = 'json';
  selectedTables: string[] = [];

  ngOnInit(): void {
    this.tenantService.loadTenant();
    // Patch form when tenant is loaded
    const check = setInterval(() => {
      const tenant = this.tenantService.tenant();
      if (tenant) {
        this.form.patchValue({ name: tenant.name });
        clearInterval(check);
      }
    }, 100);
  }

  onSave(): void {
    if (this.form.valid && this.form.dirty) {
      this.tenantService.updateTenant(this.form.value);
      this.form.markAsPristine();
    }
  }

  onDelete(): void {
    this.tenantService.deleteTenant();
  }

  onExport(): void {
    const dto: ExportTenantDto = {
      format: this.selectedFormat,
      include: this.selectedTables,
    };
    this.tenantService.requestExport(dto);
  }

  onDownload(): void {
    const jobId = this.tenantService.exportJobId();
    if (jobId) {
      this.tenantService.downloadExport(jobId);
    }
  }
}
