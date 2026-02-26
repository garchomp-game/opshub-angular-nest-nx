import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AdminTenantService } from '../services/tenant.service';

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzDividerModule,
    NzPopconfirmModule,
  ],
  template: `
    <div class="min-h-[calc(100vh-64px)] bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto" data-testid="tenant-settings">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900 m-0 tracking-tight">テナント設定</h1>
            <p class="text-gray-500 mt-1 mb-0 text-sm">システム全体の基本情報や危険な操作の管理を行います。</p>
        </div>

        @if (tenantService.loading()) {
            <div class="flex justify-center items-center py-24" data-testid="loading">
                <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
            </div>
        } @else if (tenantService.tenant()) {
            <div class="space-y-6">
                <!-- Basic Info Card -->
                <nz-card [nzBordered]="true" class="rounded-2xl shadow-sm" nzTitle="基本情報">
                    <form nz-form [formGroup]="form" (ngSubmit)="onSave()" nzLayout="vertical" data-testid="tenant-form">
                        <nz-form-item>
                            <nz-form-label nzRequired nzFor="tenant-name">組織名</nz-form-label>
                            <nz-form-control>
                                <input nz-input id="tenant-name" formControlName="name"
                                       placeholder="株式会社〇〇"
                                       data-testid="tenant-name-input">
                            </nz-form-control>
                        </nz-form-item>

                        <div class="flex justify-end mt-4">
                            <button nz-button nzType="primary" type="submit"
                                    [disabled]="!form.dirty"
                                    data-testid="save-btn">
                                <span nz-icon nzType="save" nzTheme="outline"></span>
                                保存する
                            </button>
                        </div>
                    </form>
                </nz-card>

                <!-- Danger Zone Card -->
                <nz-card [nzBordered]="true" class="rounded-2xl shadow-sm border-red-200" nzTitle="危険な操作">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 class="font-bold text-gray-900 mb-1">テナントの削除</h3>
                            <p class="text-sm text-gray-500 m-0 leading-relaxed">
                                このテナントと、関連するすべてのプロジェクト、タスク、ユーザーデータが完全に削除されます。
                                <br class="hidden sm:block">この操作は取り消すことができません。
                            </p>
                        </div>
                        <button nz-button nzType="primary" nzDanger
                                nz-popconfirm
                                nzPopconfirmTitle="テナントを本当に削除しますか？この操作は取り消せません。"
                                (nzOnConfirm)="onDelete()"
                                data-testid="delete-btn">
                            <span nz-icon nzType="delete" nzTheme="outline"></span>
                            テナント削除
                        </button>
                    </div>
                </nz-card>
            </div>
        }
      </div>
    </div>
  `,
  styles: [],
})
export class TenantSettingsComponent implements OnInit {
  tenantService = inject(AdminTenantService);
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);

  form: FormGroup = this.fb.group({
    name: [''],
  });

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
}
