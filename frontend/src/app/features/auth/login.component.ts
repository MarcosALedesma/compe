import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <img src="/escudo-eetp602.png" alt="Escudo EETP 602" class="login-logo">
          <h1>Sistema EETP N° 602</h1>
          <p class="login-subtitle">Gestión Escolar</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required
                   placeholder="usuario@eetp602.test">
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" required
                   placeholder="••••••••">
          </div>

          <button type="submit" [disabled]="loading" class="btn-login">
            {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>

          <p *ngIf="error" class="login-error">{{ error }}</p>
        </form>

        <p class="login-footer">E.E.T.P. N° 602 "General José de San Martín"</p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background:
        radial-gradient(circle at 20% 20%, rgba(255, 193, 7, 0.15), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(211, 47, 47, 0.1), transparent 50%),
        #111;
      padding: 1rem;
    }
    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      width: 100%;
      max-width: 420px;
      border-top: 5px solid #FFC107;
    }
    .login-header { text-align: center; margin-bottom: 2rem; }
    .login-logo {
      width: 80px; height: 80px; object-fit: contain;
      margin-bottom: 1rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
    }
    .login-header h1 {
      margin: 0;
      color: #111;
      font-size: 1.5rem;
      border: none;
      padding: 0;
    }
    .login-subtitle {
      margin: 0.25rem 0 0;
      color: #FFC107;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .login-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; }
    .form-group label {
      font-weight: 600; color: #333; font-size: 0.85rem;
      margin-bottom: 0.35rem;
    }
    .form-group input {
      padding: 0.75rem;
      border: 2px solid #E0E0E0;
      border-radius: 6px;
      font-size: 0.95rem;
      transition: border-color 0.2s;
    }
    .form-group input:focus {
      outline: none;
      border-color: #FFC107;
      box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.2);
    }
    .btn-login {
      background: #FFC107;
      color: #111;
      border: none;
      padding: 0.85rem;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: background 0.2s;
    }
    .btn-login:hover:not(:disabled) { background: #E0A800; }
    .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
    .login-error {
      color: #D32F2F;
      background: #FFEBEE;
      padding: 0.6rem;
      border-radius: 6px;
      text-align: center;
      font-size: 0.9rem;
      border-left: 3px solid #D32F2F;
    }
    .login-footer {
      text-align: center;
      color: #999;
      font-size: 0.75rem;
      margin: 1.5rem 0 0;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        const user = res.user;
        if (user.rol === 'ALUMNO') this.router.navigate(['/portal-alumno']);
        else this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.error = 'Credenciales inválidas';
        this.loading = false;
      }
    });
  }
}