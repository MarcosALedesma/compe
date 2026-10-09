import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CursosService } from '../../core/services/cursos.service';
import { ToastService } from '../../core/services/toast.service';
import { Curso } from '../../core/models/models';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Gestión de Cursos</h1>

      <div class="toolbar">
        <button (click)="abrirModal()" class="btn-add">+ Nuevo Curso</button>
      </div>

      <div class="cards-grid">
        <div class="curso-card" *ngFor="let curso of cursos">
          <div class="curso-header">
            <h3>{{ curso.anio }}° {{ curso.division }}</h3>
            <span class="turno" [ngClass]="curso.turno === 'Mañana' ? 'manana' : 'tarde'">
              {{ curso.turno }}
            </span>
          </div>
          <p class="ciclo">Ciclo Lectivo {{ curso.ciclo_lectivo }}</p>
          <div class="acciones">
            <button (click)="editar(curso)" class="btn-edit">Editar</button>
            <button (click)="eliminar(curso.id)" class="btn-delete">Eliminar</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showModal">
        <div class="modal-content">
          <h2>{{ editando ? 'Editar' : 'Nuevo' }} Curso</h2>
          <form (ngSubmit)="guardar()">
            <label>Año (1-6)</label>
            <input type="number" min="1" max="6" [(ngModel)]="cursoActual.anio" name="anio" required>
            <label>División</label>
            <input [(ngModel)]="cursoActual.division" name="division" required>
            <label>Turno</label>
            <select [(ngModel)]="cursoActual.turno" name="turno" required>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
            </select>
            <label>Ciclo Lectivo</label>
            <input type="number" [(ngModel)]="cursoActual.ciclo_lectivo" name="ciclo" required>
            <div class="modal-actions">
              <button type="button" (click)="cerrarModal()">Cancelar</button>
              <button type="submit">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; }
    .toolbar { display: flex; justify-content: flex-end; margin-bottom: 1.5rem; }
    .btn-add { background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }
    .curso-card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .curso-header { display: flex; justify-content: space-between; align-items: center; }
    .curso-header h3 { margin: 0; color: #1a237e; font-size: 1.5rem; }
    .turno { padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }
    .manana { background: #fff3cd; color: #856404; }
    .tarde { background: #d1ecf1; color: #0c5460; }
    .ciclo { color: #666; margin: 0.5rem 0 1rem; }
    .acciones { display: flex; gap: 0.5rem; }
    .btn-edit { background: #ffc107; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; }
    .btn-delete { background: #dc3545; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 400px; }
    .modal-content label { display: block; margin-top: 0.75rem; font-weight: 600; color: #555; }
    .modal-content input, .modal-content select { width: 100%; padding: 0.5rem; margin-top: 0.25rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
    .modal-actions button { padding: 0.5rem 1rem; border-radius: 4px; border: none; cursor: pointer; }
    .modal-actions button[type="button"] { background: #6c757d; color: white; }
    .modal-actions button[type="submit"] { background: #007bff; color: white; }
    @media (max-width: 600px) {
      .container { padding: 1rem; }
      .cards-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CursosComponent implements OnInit {
  cursos: Curso[] = [];
  showModal = false;
  editando = false;
  cursoActual: Partial<Curso> = {};

  constructor(
    private cursosService: CursosService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.cargarCursos();
  }

  cargarCursos() {
    this.cursosService.getCursos().subscribe({
      next: (data) => this.cursos = data,
      error: () => this.toast.show('Error al cargar cursos', 'error')
    });
  }

  abrirModal() {
    this.editando = false;
    this.cursoActual = { turno: 'Mañana', ciclo_lectivo: 2026 };
    this.showModal = true;
  }

  editar(curso: Curso) {
    this.editando = true;
    this.cursoActual = { ...curso };
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
  }

  guardar() {
    if (this.editando && this.cursoActual.id) {
      this.cursosService.updateCurso(this.cursoActual.id, this.cursoActual as Curso).subscribe({
        next: () => {
          this.toast.show('Curso actualizado', 'success');
          this.cargarCursos();
          this.cerrarModal();
        },
        error: () => this.toast.show('Error al actualizar', 'error')
      });
    } else {
      this.cursosService.createCurso(this.cursoActual as Curso).subscribe({
        next: () => {
          this.toast.show('Curso creado', 'success');
          this.cargarCursos();
          this.cerrarModal();
        },
        error: () => this.toast.show('Error al crear', 'error')
      });
    }
  }

  eliminar(id: number) {
    if (confirm('¿Eliminar este curso? Se eliminarán las materias asociadas.')) {
      this.cursosService.deleteCurso(id).subscribe({
        next: () => {
          this.toast.show('Curso eliminado', 'success');
          this.cargarCursos();
        },
        error: () => this.toast.show('Error al eliminar', 'error')
      });
    }
  }
}