import { Injectable, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { Subject, Observable } from 'rxjs';

export interface ModalConfig {
  data?: {
    title?: string;
    message?: string;
    confirmText?: string;
    confirmClass?: string;
    [key: string]: any;
  };
  width?: string;
}

/** Compatibility shim keeping the same afterClosed() API */
export class ModalRef<T = any, R = any> {
  private afterClosedSubject = new Subject<R | undefined>();
  componentInstance: any = {};

  close(result?: R): void {
    this.afterClosedSubject.next(result);
    this.afterClosedSubject.complete();
  }

  afterClosed(): Observable<R | undefined> {
    return this.afterClosedSubject.asObservable();
  }
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private confirmationService = inject(ConfirmationService);

  /**
   * Opens a confirm dialog.
   * Returns a ModalRef whose afterClosed() emits true/false (same API as before).
   */
  open<T>(component: any, config?: ModalConfig): ModalRef<T, boolean> {
    const modalRef = new ModalRef<T, boolean>();
    const data = config?.data ?? {};

    this.confirmationService.confirm({
      header: data.title ?? '確認',
      message: data.message ?? '',
      acceptLabel: data.confirmText ?? '確認',
      rejectLabel: 'キャンセル',
      accept: () => modalRef.close(true),
      reject: () => modalRef.close(false),
    });

    return modalRef;
  }
}
