import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Carga de Calificaciones</h1>
      
      <div class="selector-row">
        <select [(ngModel)]="cursoSeleccionado" (change)="cargarMaterias()">
          <option value="">Seleccione Curso</option>
          <option *ngFor="let c of cursos" [value]="c.id">{{ c.anio }}° {{ c.division }} - {{ c.turno }}</option>
        </select>
        
        <select [(ngModel)]="materiaSeleccionada" (change)="cargarAlumnos()">
          <option value="">Seleccione Materia</option>
          <option *ngFor="let m of materias" [value]="m.id">{{ m.materia }}</option>
        </select>
        
        <select [(ngModel)]="trimestre" (change)="cargarAlumnos()">
          <option [value]="1">1° Trimestre</option>
          <option [value]="2">2° Trimestre</option>
          <option [value]="3">3° Trimestre</option>
        </select>
      </div>

      <table class="table" *ngIf="alumnos.length > 0">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Nota (1-10)</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let alumno of alumnos">
            <td>{{ alumno.apellido }}, {{ alumno.nombre }}</td>
            <td>
              <input type="number" min="1" max="10" [(ngModel)]="notas[alumno.id]" (change)="validarNota(alumno.id)" class="nota-input">
            </td>
            <td>
              <span *ngIf="notas[alumno.id] >= 6" class="aprobado">Aprobado</span>
              <span *ngIf="notas[alumno.id] < 6 && notas[alumno.id] > 0" class="desaprobado">Desaprobado</span>
            </td>
          </tr>
        </tbody>
      </table>
      <button *ngIf="alumnos.length > 0" (click)="guardarNotas()" class="btn-save">Guardar Notas</button>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; }
    .selector-row { display: flex; gap: 1rem; margin-bottom: 2rem; }
    .table { width: 100%; border-collapse: collapse; background: white; }
    .table th, .table td { padding: 0.75rem; border: 1px solid #ddd; }
    .nota-input { width: 60px; padding: 0.25rem; }
    .aprobado { color: green; font-weight: bold; }
    .desaprobado { color: red; font-weight: bold; }
    .btn-save { margin-top: 1rem; background: #007bff; color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; }
  `]
})
export class CalificacionesComponent implements OnInit {
  cursos: any[] = [];
  materias: any[] = [];
  alumnos: any[] = [];
  cursoSeleccionado = '';
  materiaSeleccionada = '';
  trimestre = 1;
  notas: { [key: number]: number } = {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/cursos').subscribe(data => this.cursos = data);
  }

  cargarMaterias() {
    this.materias = [];
    this.materiaSeleccionada = '';
    this.alumnos = [];
    this.notas = {};
    if (!this.cursoSeleccionado) return;

    this.api.get<any[]>(`/cursos/${this.cursoSeleccionado}/materias`).subscribe({
      next: data => this.materias = data,
      error: () => alert('No se pudieron cargar las materias del curso')
    });
  }

  cargarAlumnos() {
    this.alumnos = [];
    this.notas = {};
    if (!this.cursoSeleccionado || !this.materiaSeleccionada) return;

    this.api.get<any[]>(`/alumnos?curso_id=${this.cursoSeleccionado}`).subscribe(data => {
      this.alumnos = data;
    });

    this.api.get<any[]>(`/calificaciones?materia_curso_id=${this.materiaSeleccionada}`).subscribe({
      next: data => {
        data
          .filter(calificacion => calificacion.trimestre === Number(this.trimestre))
          .forEach(calificacion => this.notas[calificacion.alumno_id] = calificacion.nota);
      },
      error: () => alert('No se pudieron cargar las notas existentes')
    });
  }

  validarNota(alumnoId: number) {
    const nota = this.notas[alumnoId];
    if (nota == null || nota === 0) {
      delete this.notas[alumnoId];
      return;
    }
    if (Number(nota) < 1 || Number(nota) > 10) {
      alert('La nota debe estar entre 1 y 10');
      delete this.notas[alumnoId];
      return;
    }
    this.notas[alumnoId] = Number(nota);
  }

  guardarNotas() {
    const payload = this.alumnos
      .filter(alumno => this.notas[alumno.id] != null)
      .map(alumno => ({
        alumno_id: alumno.id,
        materia_curso_id: Number(this.materiaSeleccionada),
        trimestre: Number(this.trimestre),
        nota: Number(this.notas[alumno.id])
      }));

    if (payload.length === 0) {
      alert('Ingresá al menos una nota antes de guardar');
      return;
    }

    this.api.post('/calificaciones/bulk', { calificaciones: payload }).subscribe({
      next: () => alert('Notas guardadas correctamente'),
      error: () => alert('No se guardaron las notas. Revisá los datos y volvé a intentar')
    });
  }
}