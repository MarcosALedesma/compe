import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlumnosService } from '../../core/services/alumnos.service';
import { Alumno, Curso } from '../../core/models/models';

type AlumnoForm = Omit<Alumno, 'id'> & { id?: number };

const vacio = (): AlumnoForm => ({
  dni: '', apellido: '', nombre: '', fecha_nac: '',
  tutor: '', telefono_tutor: '', activo: true, curso_id: null,
});

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    .toolbar { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; margin-block: 1rem; }
    .toolbar input[type=search] { flex: 1; min-width: 180px; padding: .55rem; }
    .panel { background: var(--surface); box-shadow: var(--shadow); border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: .8rem; }
    .grid label { display: block; font-size: .85rem; }
    .grid input, .grid select { width: 100%; padding: .5rem; margin-top: .2rem; box-sizing: border-box; }
    .errors { color: var(--danger); margin: .8rem 0 0; padding-left: 1.1rem; font-size: .9rem; }
    .actions { display: flex; gap: .5rem; margin-top: 1rem; }
    .table-wrap { overflow-x: auto; background: var(--surface); box-shadow: var(--shadow); border-radius: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .6rem .7rem; text-align: left; white-space: nowrap; }
    tr + tr td { border-top: 1px solid var(--bg); }
    .inactivo { opacity: .5; }
    .vacio { padding: 1.5rem; text-align: center; }
    @media (max-width: 600px) { .hide-sm { display: none; } }
  `],
  template: `
    <div class="container">
      <div class="row between" style="margin-top:1rem">
        <h2 style="margin:0">Alumnos</h2>
        <button class="btn" (click)="nuevo()"><i class="bi bi-plus-lg"></i> Nuevo</button>
      </div>

      <div class="toolbar">
        <input type="search" placeholder="Buscar por DNI o apellido" [(ngModel)]="search" (input)="buscarConDelay()" />
        <label><input type="checkbox" [(ngModel)]="incluirInactivos" (change)="cargar()" /> Ver inactivos</label>
      </div>

      @if (mostrarForm()) {
        <div class="panel">
          <h3 style="margin-top:0">{{ form.id ? 'Editar alumno' : 'Nuevo alumno' }}</h3>
          <div class="grid">
            <label>DNI <input [(ngModel)]="form.dni" name="dni" inputmode="numeric" maxlength="8" /></label>
            <label>Apellido <input [(ngModel)]="form.apellido" name="apellido" /></label>
            <label>Nombre <input [(ngModel)]="form.nombre" name="nombre" /></label>
            <label>Fecha de nacimiento <input type="date" [(ngModel)]="form.fecha_nac" name="fecha_nac" /></label>
            <label>Tutor <input [(ngModel)]="form.tutor" name="tutor" /></label>
            <label>Teléfono del tutor <input [(ngModel)]="form.telefono_tutor" name="telefono_tutor" inputmode="tel" /></label>
            <label>Curso
              <select [(ngModel)]="form.curso_id" name="curso_id">
                <option [ngValue]="null">Sin asignar</option>
                @for (c of cursos(); track c.id) {
                  <option [ngValue]="c.id">{{ c.anio }}º {{ c.division }} - {{ c.turno }}</option>
                }
              </select>
            </label>
            @if (form.id) {
              <label><input type="checkbox" [(ngModel)]="form.activo" name="activo" /> Activo</label>
            }
          </div>
          @if (errores().length) {
            <ul class="errors">@for (e of errores(); track e) { <li>{{ e }}</li> }</ul>
          }
          <div class="actions">
            <button class="btn" (click)="guardar()" [disabled]="guardando()">
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
            <button class="btn btn-outline" (click)="cancelar()">Cancelar</button>
          </div>
        </div>
      }

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>DNI</th><th>Apellido y nombre</th><th>Curso</th>
              <th class="hide-sm">Tutor</th><th class="hide-sm">Teléfono</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (a of alumnos(); track a.id) {
              <tr [class.inactivo]="!a.activo">
                <td>{{ a.dni }}</td>
                <td>{{ a.apellido }}, {{ a.nombre }}</td>
                <td>{{ cursoNombre(a.curso_id) }}</td>
                <td class="hide-sm">{{ a.tutor }}</td>
                <td class="hide-sm">{{ a.telefono_tutor }}</td>
                <td>
                  <button class="btn btn-outline btn-sm" (click)="editar(a)" aria-label="Editar"><i class="bi bi-pencil"></i></button>
                  @if (a.activo) {
                    <button class="btn btn-outline btn-sm" (click)="baja(a)" aria-label="Dar de baja"><i class="bi bi-trash"></i></button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="vacio muted">{{ cargando() ? 'Cargando...' : 'No hay alumnos para mostrar' }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AlumnosComponent implements OnInit {
  private svc = inject(AlumnosService);

  alumnos = signal<Alumno[]>([]);
  cursos = signal<Curso[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  mostrarForm = signal(false);
  errores = signal<string[]>([]);

  search = '';
  incluirInactivos = false;
  form: AlumnoForm = vacio();
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.svc.cursos().subscribe({ next: (c) => this.cursos.set(c), error: () => {} });
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.svc.listar(this.search.trim(), this.incluirInactivos).subscribe({
      next: (r) => { this.alumnos.set(r); this.cargando.set(false); },
      error: () => { this.alumnos.set([]); this.cargando.set(false); },
    });
  }

  buscarConDelay() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.cargar(), 300);
  }

  cursoNombre(id: number | null) {
    const c = this.cursos().find((x) => x.id === id);
    return c ? `${c.anio}º ${c.division}` : '—';
  }

  nuevo() { this.form = vacio(); this.errores.set([]); this.mostrarForm.set(true); }
  editar(a: Alumno) { this.form = { ...a }; this.errores.set([]); this.mostrarForm.set(true); }
  cancelar() { this.mostrarForm.set(false); }

  guardar() {
    const errs = this.validar();
    this.errores.set(errs);
    if (errs.length) return;

    this.guardando.set(true);
    const f = this.form;
    const op = f.id ? this.svc.modificar(f.id, f) : this.svc.crear(f);
    op.subscribe({
      next: () => { this.guardando.set(false); this.mostrarForm.set(false); this.cargar(); },
      error: (e) => {
        this.guardando.set(false);
        const det = e?.error?.error?.details as { message: string }[] | undefined;
        this.errores.set(det?.length ? det.map((d) => d.message) : [e?.error?.error?.message ?? 'No se pudo guardar']);
      },
    });
  }

  baja(a: Alumno) {
    if (!confirm(`¿Dar de baja a ${a.apellido}, ${a.nombre}?`)) return;
    this.svc.baja(a.id).subscribe({ next: () => this.cargar() });
  }

  /** Validación rápida en el front; el backend vuelve a validar todo. */
  private validar(): string[] {
    const f = this.form, errs: string[] = [];
    if (!/^\d{7,8}$/.test(f.dni)) errs.push('El DNI debe tener 7 u 8 dígitos');
    if (!f.apellido.trim()) errs.push('El apellido es obligatorio');
    if (!f.nombre.trim()) errs.push('El nombre es obligatorio');
    if (!f.fecha_nac) errs.push('La fecha de nacimiento es obligatoria');
    else if (new Date(f.fecha_nac) > new Date()) errs.push('La fecha de nacimiento no puede ser futura');
    return errs;
  }
}