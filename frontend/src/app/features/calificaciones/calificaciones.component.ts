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
        <select [(ngModel)]="cursoSeleccionado" (change)="cargarAlumnos()">
          <option value="">Seleccione Curso</option>
          <option *ngFor="let c of cursos" [value]="c.id">{{ c.anio }}° {{ c.division }} - {{ c.turno }}</option>
        </select>
        
        <select [(ngModel)]="materiaSeleccionada" (change)="cargarAlumnos()">
          <option value="">Seleccione Materia</option>
          <option *ngFor="let m of materias" [value]="m.id">{{ m.nombre }}</option>
        </select>
        
        <select [(ngModel)]="trimestre">
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
    this.api.get<any[]>('/materias').subscribe(data => this.materias = data);
  }

  cargarAlumnos() {
    if (!this.cursoSeleccionado || !this.materiaSeleccionada) return;
    // Aquí se debería filtrar por materia_curso_id, simplificamos por curso
    this.api.get<any[]>(`/alumnos?curso_id=${this.cursoSeleccionado}`).subscribe(data => {
      this.alumnos = data;
      // Cargar notas existentes si las hay
    });
  }

  validarNota(alumnoId: number) {
    const nota = this.notas[alumnoId];
    if (nota < 1 || nota > 10) {
      alert('La nota debe estar entre 1 y 10');
      this.notas[alumnoId] = 0; // Resetear o pedir de nuevo
    }
  }

  guardarNotas() {
    const payload = Object.keys(this.notas).map(alumnoId => ({
      alumno_id: Number(alumnoId),
      materia_curso_id: Number(this.materiaSeleccionada), // Asumiendo que materiaSeleccionada es el ID de materia_curso
      trimestre: this.trimestre,
      nota: this.notas[Number(alumnoId)]
    }));

    this.api.post('/calificaciones/bulk', payload).subscribe(() => {
      alert('Notas guardadas correctamente');
    });
  }
}