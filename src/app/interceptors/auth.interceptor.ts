import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
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
    console.log(`✅ Token añadido al header`);
    return next(cloned);
  }

  console.log(`⚠️ SIN TOKEN - Petición sin autenticación`);
  return next(req);
};
