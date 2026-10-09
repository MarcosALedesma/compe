import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h2 class="center mb">Crear cuenta</h2>
    <form class="form card card-body" [formGroup]="form" (ngSubmit)="submit()">
      <div class="field"><label>Nombre</label><input class="input" formControlName="name" [class.invalid]="invalid('name')">
        @if (invalid('name')) { <div class="error">Nombre requerido</div> }</div>
      <div class="field"><label>Email</label><input class="input" type="email" formControlName="email" [class.invalid]="invalid('email')">
        @if (invalid('email')) { <div class="error">Email inválido</div> }</div>
      <div class="field"><label>Contraseña</label><input class="input" type="password" formControlName="password" [class.invalid]="invalid('password')">
        @if (invalid('password')) { <div class="error">Mínimo 6 caracteres</div> }</div>
      <button class="btn btn-block" [disabled]="loading()">Registrarme</button>
      <p class="center muted">¿Ya tenés cuenta? <a routerLink="/login" style="color:var(--primary)">Ingresá</a></p>
    </form>`,
})
export class RegisterComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService); private router = inject(Router);
  loading = signal(false);
  form = this.fb.nonNullable.group({
    name: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(6)]],
  });
  invalid(c: 'name' | 'email' | 'password') { const x = this.form.controls[c]; return x.invalid && (x.dirty || x.touched); }
  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { name, email, password } = this.form.getRawValue();
    this.auth.register(name, email, password).subscribe({ next: () => this.router.navigate(['/products']), error: () => this.loading.set(false) });
  }
}
