import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { AuthResponse, Rol, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private router = inject(Router);

  user = signal<User | null>(this.storage.get<User>('user'));
  token = signal<string | null>(this.storage.get<string>('token'));
  isLoggedIn = computed(() => !!this.token());
  rol = computed<Rol | null>(() => this.user()?.rol ?? null);
  isDirector = computed(() => this.rol() === 'director');
  isDocente = computed(() => this.rol() === 'docente');
  isAlumno = computed(() => this.rol() === 'alumno');

  /** Pantalla de inicio según el rol */
  homeRoute(): string {
    switch (this.rol()) {
      case 'director': return '/dashboard';
      case 'docente': return '/calificaciones';
      case 'alumno': return '/portal';
      default: return '/login';
    }
  }

  login(email: string, password: string) {
    return this.api.post<AuthResponse>('/auth/login', { email, password }).pipe(tap((r) => this.save(r)));
  }

  logout() {
    this.storage.remove('token'); this.storage.remove('user');
    this.token.set(null); this.user.set(null);
    this.router.navigate(['/login']);
  }

  private save(r: AuthResponse) {
    this.storage.set('token', r.token); this.storage.set('user', r.user);
    this.token.set(r.token); this.user.set(r.user);
  }
}