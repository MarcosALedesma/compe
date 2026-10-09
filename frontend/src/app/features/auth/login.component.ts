import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h2 class="center mb">Ingresar</h2>
    <form class="form card card-body" [formGroup]="form" (ngSubmit)="submit()">
      <div class="field"><label>Email</label>
        <input class="input" type="email" formControlName="email" [class.invalid]="invalid('email')">
        @if (invalid('email')) { <div class="error">Ingresá un email válido</div> }</div>
      <div class="field"><label>Contraseña</label>
        <input class="input" type="password" formControlName="password" [class.invalid]="invalid('password')">
        @if (invalid('password')) { <div class="error">Mínimo 6 caracteres</div> }</div>
      <button class="btn btn-block" [disabled]="loading()">Ingresar</button>
      <p class="center muted">¿No tenés cuenta? <a routerLink="/register" style="color:var(--primary)">Registrate</a></p>
      <p class="center muted" style="font-size:.8rem">Demo: user&#64;test.com / user123</p>
    </form>`,
})
export class LoginComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService); private router = inject(Router);
  loading = signal(false);
  form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(6)]] });
  invalid(c: 'email' | 'password') { const x = this.form.controls[c]; return x.invalid && (x.dirty || x.touched); }
  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({ next: () => this.router.navigate(['/products']), error: () => this.loading.set(false) });
  }
}
