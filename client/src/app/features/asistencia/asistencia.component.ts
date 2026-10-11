import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Toma de Asistencia</h1>
      
      <div class="controls">
        <input type="date" [(ngModel)]="fecha" (change)="cargarAlumnos()">
        <select [(ngModel)]="cursoSeleccionado" (change)="cargarAlumnos()">
          <option value="">Seleccione Curso</option>
          <option *ngFor="let c of cursos" [value]="c.id">{{ c.anio }}° {{ c.division }}</option>
        </select>
      </div>

      <table class="table" *ngIf="alumnos.length > 0">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let alumno of alumnos">
            <td>{{ alumno.apellido }}, {{ alumno.nombre }}</td>
            <td>
              <select [(ngModel)]="asistencias[alumno.id]" class="estado-select">
                <option value="P">Presente</option>
                <option value="A">Ausente</option>
                <option value="T">Tarde (1/2 falta)</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
      <button *ngIf="alumnos.length > 0" (click)="guardarAsistencia()" class="btn-save">Guardar Asistencia</button>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; }
    .controls { display: flex; gap: 1rem; margin-bottom: 2rem; }
    .table { width: 100%; border-collapse: collapse; background: white; }
    .table th, .table td { padding: 0.75rem; border: 1px solid #ddd; }
    .estado-select { padding: 0.25rem; }
    .btn-save { margin-top: 1rem; background: #007bff; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; }
  `]
})
export class AsistenciaComponent implements OnInit {
  cursos: any[] = [];
  alumnos: any[] = [];
  cursoSeleccionado = '';
  fecha = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  asistencias: { [key: number]: string } = {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/cursos').subscribe(data => this.cursos = data);
  }

  cargarAlumnos() {
    if (!this.cursoSeleccionado || !this.fecha) {
      this.alumnos = [];
      this.asistencias = {};
      return;
    }

    this.api.get<{ alumnos: any[] }>(`/asistencias/curso/${this.cursoSeleccionado}?fecha=${this.fecha}`).subscribe({
      next: data => {
        this.alumnos = data.alumnos;
        this.asistencias = {};
        this.alumnos.forEach(alumno => this.asistencias[alumno.id] = alumno.estado ?? 'P');
      },
      error: () => alert('No se pudo cargar la asistencia del curso')
    });
  }

  guardarAsistencia() {
    if (!this.cursoSeleccionado || this.alumnos.length === 0) return;

    const registros = this.alumnos.map(alumno => ({
      alumno_id: alumno.id,
      estado: this.asistencias[alumno.id]
    }));

    this.api.post('/asistencias/toma', {
      curso_id: Number(this.cursoSeleccionado),
      fecha: this.fecha,
      registros
    }).subscribe({
      next: () => alert('Asistencia guardada correctamente'),
      error: () => alert('No se pudo guardar la asistencia')
    });
  }
}