import { Component, input } from '@angular/core';
import { ModalRef } from './modal-ref';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="modal-box">
      <h3 class="text-lg font-bold">{{ title() }}</h3>
      <p class="py-4 text-base-content/70">{{ message() }}</p>
      <div class="modal-action">
        <button class="btn btn-ghost" (click)="onCancel()">キャンセル</button>
        <button class="btn" [class]="confirmClass()" (click)="onConfirm()">{{ confirmText() }}</button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  title = input('確認');
  message = input('');
  confirmText = input('確認');
  confirmClass = input('btn-primary');
  data: any;

  modalRef!: ModalRef<ConfirmDialogComponent, boolean>;

  onConfirm(): void {
    this.modalRef.close(true);
  }

  onCancel(): void {
    this.modalRef.close(false);
  }
}
