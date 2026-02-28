import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroExclamationTriangle, heroInformationCircle } from '@ng-icons/heroicons/outline';
import { ModalRef } from '../../shared/ui/modal/modal-ref';

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
 imports: [NgIcon],
 viewProviders: [provideIcons({ heroExclamationTriangle, heroInformationCircle })],
 template: `
  <div class="modal-box" data-testid="confirm-dialog">
   <div class="flex items-center gap-3 mb-4">
    <div class="flex items-center justify-center w-10 h-10 rounded-full"
       [class]="data.color === 'warn' ? 'bg-error/10 text-error' : 'bg-info/10 text-info'">
     <ng-icon
      [name]="data.color === 'warn' ? 'heroExclamationTriangle' : 'heroInformationCircle'"
      class="text-xl"
     />
    </div>
    <h3 class="text-lg font-bold m-0">{{ data.title }}</h3>
   </div>

   <p class="text-base-content/70 mb-6 whitespace-pre-wrap leading-relaxed pl-[52px]">
    {{ data.message }}
   </p>

   <div class="modal-action">
    <button class="btn btn-ghost" (click)="modalRef.close(false)" data-testid="confirm-cancel-btn">
     {{ data.cancelText ?? 'キャンセル' }}
    </button>
    <button
     class="btn"
     [class]="data.color === 'warn' ? 'btn-error' : 'btn-primary'"
     (click)="modalRef.close(true)"
     data-testid="confirm-ok-btn"
    >
     {{ data.confirmText ?? '確認' }}
    </button>
   </div>
  </div>
 `,
})
export class ConfirmDialogComponent {
 modalRef!: ModalRef<ConfirmDialogComponent, boolean>;
 data!: ConfirmDialogData;
}
