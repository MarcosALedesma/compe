import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/models';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);

  const roles = route.data['roles'] as Rol[] | undefined;
  if (!roles || (auth.rol() && roles.includes(auth.rol()!))) return true;

  return router.createUrlTree([auth.homeRoute()]);
};