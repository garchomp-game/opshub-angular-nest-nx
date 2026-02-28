import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { LoggerService } from '../services/logger.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const logger = inject(LoggerService).createChild('AuthInterceptor');
  const token = auth.getAccessToken();

  // トークンがあれば Bearer ヘッダーを付与
  if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 → トークンリフレッシュを試行（auth/ エンドポイント以外）
      if (error.status === 401 && !req.url.includes('/auth/')) {
        logger.debug('401 received, attempting token refresh', { url: req.url });
        return auth.refreshToken().pipe(
          switchMap((res) => {
            if (res.success) {
              logger.debug('token refresh success, retrying request');
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${res.data.accessToken}` },
              });
              return next(retryReq);
            }
            // 初期化中でなければ logout
            if (!auth.initializing()) {
              logger.warn('token refresh returned unsuccessful, logging out');
              auth.logout();
            }
            return throwError(() => error);
          }),
          catchError((refreshErr) => {
            // 初期化中でなければ logout
            if (!auth.initializing()) {
              logger.warn('token refresh failed, logging out', {
                status: refreshErr.status,
                message: refreshErr.message,
              });
              auth.logout();
            } else {
              logger.debug('token refresh failed during init, skipping logout');
            }
            return throwError(() => error);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
