import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

const SEVERITY_MAP: Record<ToastType, string> = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warn',
};

const SUMMARY_MAP: Record<ToastType, string> = {
  success: '成功',
  error: 'エラー',
  info: '情報',
  warning: '警告',
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private messageService = inject(MessageService);

  show(message: string, type: ToastType = 'info', durationMs = 3000): void {
    this.messageService.add({
      severity: SEVERITY_MAP[type],
      summary: SUMMARY_MAP[type],
      detail: message,
      life: durationMs,
    });
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'error', 5000); }
  info(message: string): void { this.show(message, 'info'); }
  warning(message: string): void { this.show(message, 'warning'); }
}
