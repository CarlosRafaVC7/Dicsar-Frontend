import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // No agregar token a las peticiones de login
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  console.log(`📡 Interceptor - URL: ${req.url}`);
  console.log(`🔑 Interceptor - Token: ${token ? 'Existe' : 'NO EXISTE'}`);

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    // Manejar errores de respuesta
    return next(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si el token expira o es inválido (401 Unauthorized), redirigir al login
        if (error.status === 401) {
          authService.logout();
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }

  console.log(`⚠️ SIN TOKEN - Petición sin autenticación`);
  return next(req);
};
