import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface Cuenta {
  id: number;
  email: string;
  rol: 'directivo' | 'docente' | 'alumno';
  activo: boolean | number;
  docente_apellido?: string;
  docente_nombre?: string;
  alumno_apellido?: string;
  alumno_nombre?: string;
}

interface PersonaDisponible {
  id: number;
  apellido: string;
  nombre: string;
  dni: string;
  email?: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Accesos de usuarios</h1>

      <section class="form-section">
        <h2>Crear acceso</h2>
        <form (ngSubmit)="crearCuenta()">
          <label>Rol</label>
          <select [(ngModel)]="rolNuevo" name="rol" (change)="cargarDisponibles()" required>
            <option value="docente">Docente</option>
            <option value="alumno">Alumno</option>
          </select>

          <label>Persona</label>
          <select [(ngModel)]="personaId" name="persona" required>
            <option [ngValue]="null">Seleccioná una persona...</option>
            <option *ngFor="let persona of disponibles" [ngValue]="persona.id">
              {{ persona.apellido }}, {{ persona.nombre }} · DNI {{ persona.dni }}
            </option>
          </select>

          <label>Email de acceso</label>
          <input type="email" [(ngModel)]="emailNuevo" name="email" required autocomplete="email">
          <label>Contraseña inicial</label>
          <input type="password" [(ngModel)]="passwordNuevo" name="password" minlength="10" required autocomplete="new-password">
          <button type="submit" [disabled]="!disponibles.length">Crear cuenta</button>
        </form>
      </section>

      <section class="accounts-section">
        <h2>Cuentas registradas</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Usuario</th><th>Rol</th><th>Persona vinculada</th><th>Estado</th><th>Contraseña</th><th>Acción</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let cuenta of cuentas">
                <td>{{ cuenta.email }}</td>
                <td>{{ cuenta.rol }}</td>
                <td>{{ nombrePersona(cuenta) }}</td>
                <td>{{ cuenta.activo ? 'Activa' : 'Desactivada' }}</td>
                <td>
                  <input *ngIf="cuenta.rol !== 'directivo'" type="password"
                    [(ngModel)]="passwords[cuenta.id]" [name]="'password-' + cuenta.id"
                    minlength="10" placeholder="Nueva (10+ caracteres)" autocomplete="new-password">
                </td>
                <td class="actions">
                  <button *ngIf="cuenta.rol !== 'directivo'" type="button" (click)="cambiarPassword(cuenta)">Restablecer</button>
                  <button *ngIf="cuenta.rol !== 'directivo'" type="button" (click)="cambiarEstado(cuenta)">
                    {{ cuenta.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                  <span *ngIf="cuenta.rol === 'directivo'">Protegida</span>
                </td>
              </tr>
              <tr *ngIf="cuentas.length === 0"><td colspan="6">No hay cuentas registradas.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    h1 { margin-bottom: 1.5rem; }
    .form-section, .accounts-section { margin-bottom: 2rem; }
    form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem 1rem; max-width: 760px; }
    label { align-self: end; font-weight: 600; }
    input, select { min-width: 0; padding: 0.6rem; border: 1px solid #bbb; border-radius: 4px; }
    form button { grid-column: 2; justify-self: start; padding: 0.6rem 1rem; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { padding: 0.65rem; border: 1px solid #ddd; text-align: left; }
    td input { width: 180px; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .actions button { padding: 0.4rem 0.6rem; }
    @media (max-width: 650px) {
      .container { padding: 1rem; }
      form { grid-template-columns: 1fr; }
      form button { grid-column: 1; }
    }
  `]
})
export class UsuariosComponent implements OnInit {
  cuentas: Cuenta[] = [];
  disponibles: PersonaDisponible[] = [];
  rolNuevo: 'docente' | 'alumno' = 'docente';
  personaId: number | null = null;
  emailNuevo = '';
  passwordNuevo = '';
  passwords: Record<number, string> = {};

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.cargarCuentas();
    this.cargarDisponibles();
  }

  cargarCuentas() {
    this.api.get<Cuenta[]>('/usuarios').subscribe({
      next: data => this.cuentas = data,
      error: () => this.toast.error('No se pudieron cargar las cuentas')
    });
  }

  cargarDisponibles() {
    this.personaId = null;
    this.api.get<PersonaDisponible[]>(`/usuarios/disponibles?rol=${this.rolNuevo}`).subscribe({
      next: data => this.disponibles = data,
      error: () => this.toast.error('No se pudieron cargar las personas disponibles')
    });
  }

  crearCuenta() {
    if (this.personaId == null) return;
    this.api.post('/usuarios', {
      rol: this.rolNuevo,
      entidad_id: this.personaId,
      email: this.emailNuevo,
      password: this.passwordNuevo
    }).subscribe({
      next: () => {
        this.toast.success('Cuenta creada');
        this.emailNuevo = '';
        this.passwordNuevo = '';
        this.cargarCuentas();
        this.cargarDisponibles();
      },
      error: () => this.toast.error('No se pudo crear la cuenta. Verificá el email y los datos.')
    });
  }

  cambiarEstado(cuenta: Cuenta) {
    const activo = !Boolean(cuenta.activo);
    this.api.put(`/usuarios/${cuenta.id}/activo`, { activo }).subscribe({
      next: () => {
        this.toast.success(activo ? 'Cuenta activada' : 'Cuenta desactivada');
        this.cargarCuentas();
      },
      error: () => this.toast.error('No se pudo cambiar el estado de la cuenta')
    });
  }

  cambiarPassword(cuenta: Cuenta) {
    const password = this.passwords[cuenta.id];
    if (!password || password.length < 10) {
      this.toast.error('La contraseña debe tener al menos 10 caracteres');
      return;
    }
    this.api.put(`/usuarios/${cuenta.id}/password`, { password }).subscribe({
      next: () => {
        delete this.passwords[cuenta.id];
        this.toast.success('Contraseña restablecida');
      },
      error: () => this.toast.error('No se pudo restablecer la contraseña')
    });
  }

  nombrePersona(cuenta: Cuenta) {
    if (cuenta.rol === 'docente') return `${cuenta.docente_apellido ?? ''}, ${cuenta.docente_nombre ?? ''}`;
    if (cuenta.rol === 'alumno') return `${cuenta.alumno_apellido ?? ''}, ${cuenta.alumno_nombre ?? ''}`;
    return 'Administración';
  }
}
