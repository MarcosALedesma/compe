import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    .box { max-width: 380px; margin: 8vh auto; background: var(--surface); box-shadow: var(--shadow);
           border-radius: 12px; padding: 1.5rem; }
    h1 { font-size: 1.3rem; margin: 0 0 .25rem; color: var(--primary); }
    label { display: block; margin-top: .9rem; font-size: .9rem; }
    input { width: 100%; padding: .6rem; margin-top: .25rem; box-sizing: border-box; }
    .error { color: var(--danger); margin-top: .8rem; font-size: .9rem; }
    button { width: 100%; margin-top: 1.2rem; }
  `],
  template: `
    <div class="container">
      <div class="box">
        <h1>EETP Nº 602</h1>
        <p class="muted">Sistema de Gestión Escolar</p>
        <label>Email
          <input type="email" [(ngModel)]="email" name="email" autocomplete="username" />
        </label>
        <label>Contraseña
          <input type="password" [(ngModel)]="password" name="password" autocomplete="current-password"
                 (keyup.enter)="submit()" />
        </label>
        @if (error()) { <div class="error">{{ error() }}</div> }
        <button class="btn" (click)="submit()" [disabled]="loading() || !email || !password">
          {{ loading() ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate([this.auth.homeRoute()]),
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.error?.message ?? 'Email o contraseña incorrectos');
      },
    });
  }
}