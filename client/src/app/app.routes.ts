import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [AuthGuard] },
  { path: 'alumnos', loadComponent: () => import('./features/alumnos/alumnos.component').then(m => m.AlumnosComponent), canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'DIRECTIVO' } },
  { path: 'docentes', loadComponent: () => import('./features/docentes/docentes.component').then(m => m.DocentesComponent), canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'DIRECTIVO' } },
  { path: 'cursos', loadComponent: () => import('./features/cursos/cursos.component').then(m => m.CursosComponent), canActivate: [AuthGuard] },
  { path: 'calificaciones', loadComponent: () => import('./features/calificaciones/calificaciones.component').then(m => m.CalificacionesComponent), canActivate: [AuthGuard] },
  { path: 'asistencia', loadComponent: () => import('./features/asistencia/asistencia.component').then(m => m.AsistenciaComponent), canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'DOCENTE' } },
  { path: 'calendario', loadComponent: () => import('./features/calendario/calendario.component').then(m => m.CalendarioComponent), canActivate: [AuthGuard] },
  { path: 'boletin', loadComponent: () => import('./features/boletin/boletin.component').then(m => m.BoletinComponent), canActivate: [AuthGuard] },
  { path: 'portal-alumno', loadComponent: () => import('./features/portal-alumno/portal-alumno.component').then(m => m.PortalAlumnoComponent), canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'ALUMNO' } },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) }
];