import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  const securedRequest =
    token && !req.url.includes('/auth/login/') && !req.url.includes('/auth/register/')
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next(securedRequest).pipe(
    catchError((error) => {
      if (error.status === 401 && auth.isAuthenticated()) {
        auth.clearSession();
      }
      return throwError(() => error);
    }),
  );
};
