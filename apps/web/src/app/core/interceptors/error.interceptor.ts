import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { LoggerService } from '../services/logger.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);
  const logger = inject(LoggerService).createChild('ErrorInterceptor');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 は AuthInterceptor が処理するのでスキップ
      if (error.status === 401) return throwError(() => error);

      // ネットワークエラー (status: 0) の検出
      if (error.status === 0) {
        logger.warn('Network error detected (retryable)', {
          url: error.url,
          method: req.method,
          message: error.message,
          retryable: true,
        });

        messageService.add({
          severity: 'error',
          summary: 'ネットワークに接続できません。接続を確認してください。',
          life: 5000,
        });

        return throwError(() => error);
      }

      // HTTP エラーの詳細をログに記録（URL, method, レスポンス body を含む）
      logger.error('HTTP error', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        method: req.method,
        message: error.error?.error?.message ?? error.error?.message ?? error.message,
        responseBody: error.error,
      });

      const message = error.error?.error?.message
        ?? error.error?.message
        ?? 'サーバーエラーが発生しました';

      messageService.add({
        severity: error.status >= 500 ? 'error' : 'warn',
        summary: message,
        life: 5000,
      });

      return throwError(() => error);
    }),
  );
};
