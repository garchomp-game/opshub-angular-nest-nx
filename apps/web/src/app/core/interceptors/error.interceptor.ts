import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { LoggerService } from '../services/logger.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
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

        snackBar.open('ネットワークに接続できません。接続を確認してください。', '閉じる', {
          duration: 5000,
          panelClass: ['error-snackbar'],
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

      snackBar.open(message, '閉じる', {
        duration: 5000,
        panelClass: error.status >= 500 ? ['error-snackbar'] : ['warn-snackbar'],
      });

      return throwError(() => error);
    }),
  );
};
