import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocentesService } from '../../core/services/docentes.service';
import { ToastService } from '../../core/services/toast.service';
import { Docente } from '../../core/models/models';

@Component({
  selector: 'app-docentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Gestión de Docentes</h1>

      <div class="toolbar">
        <input type="text" [(ngModel)]="filtro" (input)="filtrar()" placeholder="Buscar por DNI, apellido o email..." class="search-input">
        <button (click)="abrirModal()" class="btn-add">+ Nuevo Docente</button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>DNI</th>
            <th>Apellido</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let docente of docentesFiltrados">
            <td>{{ docente.dni }}</td>
            <td>{{ docente.apellido }}</td>
            <td>{{ docente.nombre }}</td>
            <td>{{ docente.email }}</td>
            <td>{{ docente.telefono }}</td>
            <td>
              <button (click)="editar(docente)" class="btn-edit">Editar</button>
              <button (click)="eliminar(docente.id)" class="btn-delete">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="modal-overlay" *ngIf="showModal">
        <div class="modal-content">
          <h2>{{ editando ? 'Editar' : 'Nuevo' }} Docente</h2>
          <form (ngSubmit)="guardar()">
            <label>DNI</label>
            <input [(ngModel)]="docenteActual.dni" name="dni" required>
            <label>Apellido</label>
            <input [(ngModel)]="docenteActual.apellido" name="apellido" required>
            <label>Nombre</label>
            <input [(ngModel)]="docenteActual.nombre" name="nombre" required>
            <label>Email</label>
            <input type="email" [(ngModel)]="docenteActual.email" name="email" required>
            <label>Teléfono</label>
            <input [(ngModel)]="docenteActual.telefono" name="telefono" required>
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
    .toolbar { display: flex; justify-content: space-between; margin-bottom: 1rem; gap: 1rem; }
    .search-input { padding: 0.5rem; flex: 1; max-width: 400px; border: 1px solid #ccc; border-radius: 4px; }
    .btn-add { background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    .table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .table th, .table td { padding: 0.75rem; border: 1px solid #eee; text-align: left; }
    .table th { background: #f8f9fa; }
    .btn-edit { background: #ffc107; border: none; padding: 0.25rem 0.5rem; margin-right: 5px; border-radius: 4px; cursor: pointer; }
    .btn-delete { background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 450px; }
    .modal-content label { display: block; margin-top: 0.75rem; font-weight: 600; color: #555; }
    .modal-content input { width: 100%; padding: 0.5rem; margin-top: 0.25rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
    .modal-actions button { padding: 0.5rem 1rem; border-radius: 4px; border: none; cursor: pointer; }
    .modal-actions button[type="button"] { background: #6c757d; color: white; }
    .modal-actions button[type="submit"] { background: #007bff; color: white; }
  `]
})
export class DocentesComponent implements OnInit {
  docentes: Docente[] = [];
  docentesFiltrados: Docente[] = [];
  filtro = '';
  showModal = false;
  editando = false;
  docenteActual: Partial<Docente> = {};

  constructor(
    private docentesService: DocentesService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.cargarDocentes();
  }

  cargarDocentes() {
    this.docentesService.getDocentes().subscribe({
      next: (data) => {
        this.docentes = data;
        this.filtrar();
      },
      error: () => this.toast.show('Error al cargar docentes', 'error')
    });
  }

  filtrar() {
    const f = this.filtro.toLowerCase();
    this.docentesFiltrados = this.docentes.filter(d =>
      d.dni.includes(f) ||
      d.apellido.toLowerCase().includes(f) ||
      d.nombre.toLowerCase().includes(f) ||
      d.email.toLowerCase().includes(f)
    );
  }

  abrirModal() {
    this.editando = false;
    this.docenteActual = {};
    this.showModal = true;
  }

  editar(docente: Docente) {
    this.editando = true;
    this.docenteActual = { ...docente };
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
  }

  guardar() {
    if (this.editando && this.docenteActual.id) {
      this.docentesService.updateDocente(this.docenteActual.id, this.docenteActual as Docente).subscribe({
        next: () => {
          this.toast.show('Docente actualizado', 'success');
          this.cargarDocentes();
          this.cerrarModal();
        },
        error: () => this.toast.show('Error al actualizar', 'error')
      });
    } else {
      this.docentesService.createDocente(this.docenteActual as Docente).subscribe({
        next: () => {
          this.toast.show('Docente creado', 'success');
          this.cargarDocentes();
          this.cerrarModal();
        },
        error: () => this.toast.show('Error al crear (¿DNI duplicado?)', 'error')
      });
    }
  }

  eliminar(id: number) {
    if (confirm('¿Estás seguro de eliminar este docente?')) {
      this.docentesService.deleteDocente(id).subscribe({
        next: () => {
          this.toast.show('Docente eliminado', 'success');
          this.cargarDocentes();
        },
        error: () => this.toast.show('Error al eliminar', 'error')
      });
    }
  }
}