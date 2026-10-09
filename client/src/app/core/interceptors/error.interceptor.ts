import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error) => {
      let msg = 'Error inesperado';
      if (error.status === 0) msg = 'No se pudo conectar con el servidor';
      else if (error.status === 401) msg = 'Sesión expirada';
      else if (error.status === 403) msg = 'No tenés permisos para esta acción';
      else if (error.status === 400) msg = error.error?.message || 'Datos inválidos';
      else if (error.status === 500) msg = 'Error interno del servidor';

      toast.error(msg);
      return throwError(() => error);
    })
  );
};