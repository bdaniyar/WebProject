import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  const isAuthFree =
    req.url.includes('/auth/login/') ||
    req.url.includes('/auth/register/') ||
    req.url.includes('/auth/refresh/');

  const securedRequest =
    token && !isAuthFree
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next(securedRequest).pipe(
    catchError((error) => {
      if (error.status === 401 && auth.isAuthenticated() && !isAuthFree) {
        // Try to refresh access token once, then retry the original request.
        return auth.refreshAccessToken().pipe(
          switchMap((newAccess) => {
            const retried = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newAccess}`,
              },
            });
            return next(retried);
          }),
          catchError((refreshError) => {
            auth.clearSession();
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
