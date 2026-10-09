import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar-institucional">
      <a routerLink="/dashboard" class="brand">
        <img src="/escudo-minimalista.png" alt="Escudo EETP 602" class="brand-logo">
        <div class="brand-text">
          <span class="brand-title">Sistema EETP N° 602</span>
          <span class="brand-subtitle">Gestión Escolar</span>
        </div>
      </a>

      <button class="menu-toggle" (click)="menuOpen = !menuOpen" aria-label="Menú">
        ☰
      </button>

      <ul class="nav-links" [class.open]="menuOpen">
        <li><a routerLink="/dashboard" routerLinkActive="active" (click)="menuOpen = false">Dashboard</a></li>
        <li *ngIf="rol === 'directivo'"><a routerLink="/alumnos" routerLinkActive="active" (click)="menuOpen = false">Alumnos</a></li>
        <li *ngIf="rol === 'directivo'"><a routerLink="/docentes" routerLinkActive="active" (click)="menuOpen = false">Docentes</a></li>
        <li><a routerLink="/cursos" routerLinkActive="active" (click)="menuOpen = false">Cursos</a></li>
        <li><a routerLink="/calificaciones" routerLinkActive="active" (click)="menuOpen = false">Notas</a></li>
        <li *ngIf="rol === 'docente'"><a routerLink="/asistencia" routerLinkActive="active" (click)="menuOpen = false">Asistencia</a></li>
        <li><a routerLink="/calendario" routerLinkActive="active" (click)="menuOpen = false">Calendario</a></li>
        <li><a routerLink="/boletin" routerLinkActive="active" (click)="menuOpen = false">Boletín</a></li>
      </ul>

      <div class="user-info">
        <span>{{ userEmail }}</span>
        <button (click)="logout()" class="btn-logout">Salir</button>
      </div>
    </nav>
  `,
  styles: [] // Los estilos están en styles.css global
})
export class NavbarComponent implements OnInit {
  menuOpen = false;
  rol = '';
  userEmail = '';

  constructor(private auth: AuthService) {}

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