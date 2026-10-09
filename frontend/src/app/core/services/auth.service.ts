import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { AuthResponse, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private router = inject(Router);

  user = signal<User | null>(this.storage.get<User>('user'));
  token = signal<string | null>(this.storage.get<string>('token'));
  isLoggedIn = computed(() => !!this.token());
  isAdmin = computed(() => this.user()?.role === 'admin');

  login(email: string, password: string) {
    return this.api.post<AuthResponse>('/auth/login', { email, password }).pipe(tap((r) => this.save(r)));
  }
  register(name: string, email: string, password: string) {
    return this.api.post<AuthResponse>('/auth/register', { name, email, password }).pipe(tap((r) => this.save(r)));
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
