import { Component, inject } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  color?: 'primary' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [NzButtonModule, NzIconModule],
  template: `
    <div class="px-2 py-4">
      <div class="flex items-center gap-3 mb-4">
        <div class="flex items-center justify-center w-10 h-10 rounded-full"
             [class]="data.color === 'warn' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'">
          <span nz-icon
                [nzType]="data.color === 'warn' ? 'exclamation-circle' : 'info-circle'"
                nzTheme="outline"
                class="text-xl"></span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 m-0">{{ data.title }}</h3>
      </div>

      <p class="text-gray-600 mb-6 whitespace-pre-wrap leading-relaxed pl-[52px]">
        {{ data.message }}
      </p>

      <div class="flex justify-end gap-3">
        <button nz-button (click)="modalRef.close(false)">
          {{ data.cancelText ?? 'キャンセル' }}
        </button>
        <button nz-button
                [nzType]="data.color === 'warn' ? 'primary' : 'primary'"
                [nzDanger]="data.color === 'warn'"
                (click)="modalRef.close(true)">
          {{ data.confirmText ?? '確認' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly modalRef = inject(NzModalRef);
  readonly data = inject<ConfirmDialogData>(NZ_MODAL_DATA);
}
