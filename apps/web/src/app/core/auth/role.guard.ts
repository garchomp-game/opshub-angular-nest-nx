import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  // Wait for initial auth state restoration
  await auth.whenReady();

  const requiredRoles = route.data['roles'] as string[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (auth.hasRole(...requiredRoles)) return true;

  messageService.add({
    severity: 'warn',
    summary: 'アクセス権限がありません',
    detail: 'このページへのアクセス権限がありません。ダッシュボードにリダイレクトします。',
    life: 5000,
  });
  router.navigate(['/dashboard']);
  return false;
};
