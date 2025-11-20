import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isLoggedIn();
  const isAdmin = authService.isAdmin();

  console.log('AdminGuard - Logged in:', isLoggedIn, 'Is Admin:', isAdmin, 'User:', authService.currentUserValue);

  if (isLoggedIn && isAdmin) {
    return true;
  }

  console.warn('AdminGuard - Access denied. Redirecting to dashboard.');
  router.navigate(['/dashboard']);
  return false;
};
