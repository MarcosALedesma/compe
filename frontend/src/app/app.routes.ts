import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent) },

  {
    path: 'dashboard', canActivate: [roleGuard], data: { roles: ['director'] },
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'alumnos', canActivate: [roleGuard], data: { roles: ['director'] },
    loadComponent: () => import('./features/alumnos/alumnos.component').then((m) => m.AlumnosComponent),
  },
  {
    path: 'docentes', canActivate: [roleGuard], data: { roles: ['director'] },
    loadComponent: () => import('./features/docentes/docentes.component').then((m) => m.DocentesComponent),
  },
  {
    path: 'cursos', canActivate: [roleGuard], data: { roles: ['director', 'docente'] },
    loadComponent: () => import('./features/cursos/cursos.component').then((m) => m.CursosComponent),
  },
  {
    path: 'calificaciones', canActivate: [roleGuard], data: { roles: ['director', 'docente'] },
    loadComponent: () => import('./features/calificaciones/calificaciones.component').then((m) => m.CalificacionesComponent),
  },
  {
    path: 'asistencia', canActivate: [roleGuard], data: { roles: ['director', 'docente'] },
    loadComponent: () => import('./features/asistencia/asistencia.component').then((m) => m.AsistenciaComponent),
  },
  {
    path: 'calendario', canActivate: [roleGuard], data: { roles: ['director', 'docente', 'alumno'] },
    loadComponent: () => import('./features/calendario/calendario.component').then((m) => m.CalendarioComponent),
  },
  {
    path: 'boletin', canActivate: [roleGuard], data: { roles: ['director', 'docente'] },
    loadComponent: () => import('./features/boletin/boletin.component').then((m) => m.BoletinComponent),
  },
  {
    path: 'portal', canActivate: [roleGuard], data: { roles: ['alumno'] },
    loadComponent: () => import('./features/portal-alumno/portal-alumno.component').then((m) => m.PortalAlumnoComponent),
  },

  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent) },
];