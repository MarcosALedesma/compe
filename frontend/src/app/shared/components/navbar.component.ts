import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem { label: string; path: string; icon: string; roles: string[]; }

const MENU: MenuItem[] = [
  { label: 'Panel', path: '/dashboard', icon: 'bi-speedometer2', roles: ['director'] },
  { label: 'Alumnos', path: '/alumnos', icon: 'bi-people', roles: ['director'] },
  { label: 'Docentes', path: '/docentes', icon: 'bi-person-workspace', roles: ['director'] },
  { label: 'Cursos', path: '/cursos', icon: 'bi-journal-bookmark', roles: ['director', 'docente'] },
  { label: 'Notas', path: '/calificaciones', icon: 'bi-card-checklist', roles: ['director', 'docente'] },
  { label: 'Asistencia', path: '/asistencia', icon: 'bi-clipboard-check', roles: ['director', 'docente'] },
  { label: 'Calendario', path: '/calendario', icon: 'bi-calendar-event', roles: ['director', 'docente', 'alumno'] },
  { label: 'Boletín', path: '/boletin', icon: 'bi-file-earmark-text', roles: ['director', 'docente'] },
  { label: 'Mis notas', path: '/portal', icon: 'bi-mortarboard', roles: ['alumno'] },
];

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styles: [`
    nav { background: var(--surface); box-shadow: var(--shadow); position: sticky; top: 0; z-index: 10; }
    .brand { font-weight: 700; font-size: 1.1rem; color: var(--primary); }
    .links a { padding: .4rem .7rem; border-radius: 8px; }
    .links a.active { background: var(--bg); color: var(--primary); }
    .burger { display: none; background: none; border: 0; font-size: 1.6rem; cursor: pointer; color: var(--primary); }
    @media (max-width: 800px) {
      .burger { display: block; }
      .links { display: none; flex-direction: column; align-items: stretch; width: 100%; padding-top: .5rem; }
      .links.open { display: flex; }
      .wrap { flex-wrap: wrap; }
    }
  `],
  template: `
    @if (auth.isLoggedIn()) {
      <nav><div class="container row between wrap" style="padding-block: .8rem">
        <a [routerLink]="auth.homeRoute()" class="brand"><i class="bi bi-mortarboard-fill"></i> EETP Nº 602</a>
        <button class="burger" (click)="open.set(!open())" aria-label="Menú"><i class="bi bi-list"></i></button>
        <div class="row links" [class.open]="open()" (click)="open.set(false)">
          @for (item of items(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active"><i class="bi {{ item.icon }}"></i> {{ item.label }}</a>
          }
          <span class="muted">{{ auth.user()?.nombre || auth.user()?.email }}</span>
          <button class="btn btn-outline btn-sm" (click)="auth.logout()">Salir</button>
        </div>
      </div></nav>
    }
  `,
})
export class NavbarComponent {
  auth = inject(AuthService);
  open = signal(false);
  items = computed(() => MENU.filter((m) => this.auth.rol() && m.roles.includes(this.auth.rol()!)));
}