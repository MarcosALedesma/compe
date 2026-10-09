import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlumnosService } from '../../core/services/alumnos.service';
import { Alumno } from '../../core/models/models';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Gestión de Alumnos</h1>
      
      <div class="toolbar">
        <input type="text" [(ngModel)]="filtro" (input)="filtrar()" placeholder="Buscar por DNI o Apellido..." class="search-input">
        <button (click)="abrirModal()" class="btn-add">+ Nuevo Alumno</button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>DNI</th>
            <th>Apellido</th>
            <th>Nombre</th>
            <th>Curso</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let alumno of alumnosFiltrados">
            <td>{{ alumno.dni }}</td>
            <td>{{ alumno.apellido }}</td>
            <td>{{ alumno.nombre }}</td>
            <td>{{ alumno.anio ? alumno.anio + '° ' + alumno.division : 'Sin curso' }}</td>
            <td>
              <button (click)="editar(alumno)" class="btn-edit">Editar</button>
              <button (click)="eliminar(alumno.id)" class="btn-delete">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Modal Simple -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <h2>{{ editando ? 'Editar' : 'Nuevo' }} Alumno</h2>
          <form (ngSubmit)="guardar()">
            <input [(ngModel)]="alumnoActual.dni" name="dni" placeholder="DNI" required>
            <input [(ngModel)]="alumnoActual.apellido" name="apellido" placeholder="Apellido" required>
            <input [(ngModel)]="alumnoActual.nombre" name="nombre" placeholder="Nombre" required>
            <input [(ngModel)]="alumnoActual.fecha_nac" name="fecha_nac" type="date" placeholder="Fecha Nac." required>
            <input [(ngModel)]="alumnoActual.tutor" name="tutor" placeholder="Tutor" required>
            <input [(ngModel)]="alumnoActual.telefono_tutor" name="telefono" placeholder="Teléfono Tutor" required>
            
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
    .toolbar { display: flex; justify-content: space-between; margin-bottom: 1rem; }
    .search-input { padding: 0.5rem; width: 300px; }
    .btn-add { background: #28a745; color: white; border: none; padding: 0.5rem 1rem; cursor: pointer; }
    .table { width: 100%; border-collapse: collapse; background: white; }
    .table th, .table td { padding: 0.75rem; border: 1px solid #ddd; text-align: left; }
    .btn-edit { background: #ffc107; border: none; padding: 0.25rem 0.5rem; margin-right: 5px; cursor: pointer; }
    .btn-delete { background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; cursor: pointer; }
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; }
    .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 400px; }
    .modal-content input { display: block; width: 100%; margin-bottom: 1rem; padding: 0.5rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; }
  `]
})
export class AlumnosComponent implements OnInit {
  alumnos: Alumno[] = [];
  alumnosFiltrados: Alumno[] = [];
  filtro = '';
  showModal = false;
  editando = false;
  alumnoActual: Partial<Alumno> = {};

  constructor(private alumnosService: AlumnosService) {}

  ngOnInit() {
    this.cargarAlumnos();
  }

  cargarAlumnos() {
    this.alumnosService.getAlumnos().subscribe(data => {
      this.alumnos = data;
      this.filtrar();
    });
  }

  filtrar() {
    this.alumnosFiltrados = this.alumnos.filter(a => 
      (a.dni ?? '').includes(this.filtro) || (a.apellido ?? '').toLowerCase().includes(this.filtro.toLowerCase())
    );
  }

  abrirModal() {
    this.editando = false;
    this.alumnoActual = { activo: true };
    this.showModal = true;
  }

  editar(alumno: Alumno) {
    this.editando = true;
    this.alumnoActual = { ...alumno };
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
  }

  guardar() {
    if (this.editando && this.alumnoActual.id) {
      this.alumnosService.updateAlumno(this.alumnoActual.id, this.alumnoActual as Alumno).subscribe(() => {
        this.cargarAlumnos();
        this.cerrarModal();
      });
    } else {
      this.alumnosService.createAlumno(this.alumnoActual as Alumno).subscribe(() => {
        this.cargarAlumnos();
        this.cerrarModal();
      });
    }
  }

  eliminar(id: number) {
    if (confirm('¿Estás seguro de eliminar este alumno?')) {
      this.alumnosService.deleteAlumno(id).subscribe(() => this.cargarAlumnos());
    }
  }
}