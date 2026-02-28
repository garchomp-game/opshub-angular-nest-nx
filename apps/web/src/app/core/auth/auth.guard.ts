import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for initial profile restoration from sessionStorage
  await auth.whenReady();

  if (auth.isAuthenticated()) return true;

  router.navigate(['/login']);
  return false;
};
