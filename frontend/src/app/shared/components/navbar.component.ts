import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="logo">
        <span class="school">EETP N° 602</span>
        <span class="app">Prime Dev 2026</span>
      </div>
      <button class="menu-toggle" (click)="menuOpen = !menuOpen">☰</button>
      <ul class="nav-links" [class.open]="menuOpen">
        <li><a routerLink="/dashboard" routerLinkActive="active">Dashboard</a></li>
        <li *ngIf="rol === 'directivo'"><a routerLink="/alumnos" routerLinkActive="active">Alumnos</a></li>
        <li *ngIf="rol === 'directivo'"><a routerLink="/docentes" routerLinkActive="active">Docentes</a></li>
        <li><a routerLink="/cursos" routerLinkActive="active">Cursos</a></li>
        <li><a routerLink="/calificaciones" routerLinkActive="active">Notas</a></li>
        <li *ngIf="rol === 'docente'"><a routerLink="/asistencia" routerLinkActive="active">Asistencia</a></li>
        <li><a routerLink="/calendario" routerLinkActive="active">Calendario</a></li>
        <li><a routerLink="/boletin" routerLinkActive="active">Boletín</a></li>
      </ul>
      <div class="user-info">
        <span>{{ userEmail }}</span>
        <button (click)="logout()" class="btn-logout">Salir</button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex; align-items: center; justify-content: space-between;
      background: #1a237e; color: white; padding: 0.75rem 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .logo { display: flex; flex-direction: column; }
    .school { font-weight: bold; font-size: 1.1rem; }
    .app { font-size: 0.75rem; opacity: 0.8; }
    .nav-links { display: flex; list-style: none; gap: 1rem; margin: 0; padding: 0; }
    .nav-links a {
      color: white; text-decoration: none; padding: 0.5rem 0.75rem;
      border-radius: 4px; transition: background 0.2s;
    }
    .nav-links a:hover, .nav-links a.active { background: rgba(255,255,255,0.2); }
    .user-info { display: flex; align-items: center; gap: 1rem; font-size: 0.85rem; }
    .btn-logout {
      background: #dc3545; color: white; border: none; padding: 0.4rem 0.8rem;
      border-radius: 4px; cursor: pointer;
    }
    .menu-toggle { display: none; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
    @media (max-width: 768px) {
      .menu-toggle { display: block; }
      .nav-links {
        display: none; flex-direction: column; position: absolute; top: 60px;
        left: 0; right: 0; background: #1a237e; padding: 1rem; z-index: 100;
      }
      .nav-links.open { display: flex; }
      .user-info span { display: none; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  menuOpen = false;
  rol = '';
  userEmail = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const user = this.auth.getUser();
    if (user) {
      this.rol = user.rol?.toLowerCase() || '';
      this.userEmail = user.email || '';
    }
  }

  logout() {
    this.auth.logout();
  }
}