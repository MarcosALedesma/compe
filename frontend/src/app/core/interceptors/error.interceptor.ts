import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const msg = err.error?.error?.message ?? (err.status === 0 ? 'No se pudo conectar con el servidor' : 'Error inesperado');
      if (err.status === 401 && auth.isLoggedIn()) auth.logout();
      toast.error(msg);
      return throwError(() => err);
    }),
  );
};
