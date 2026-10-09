import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h1>Panel de Dirección</h1>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>Total Alumnos</h3>
          <p class="number">{{ totalAlumnos }}</p>
        </div>
        <div class="metric-card">
          <h3>Total Docentes</h3>
          <p class="number">{{ totalDocentes }}</p>
        </div>
        <div class="metric-card">
          <h3>Promedio General</h3>
          <p class="number">{{ promedioGeneral }}</p>
        </div>
      </div>

      <div class="charts-section">
        <div class="chart-box">
          <h4>Alumnos por Año</h4>
          <div *ngFor="let item of alumnosPorAnio" class="bar-row">
            <span>{{ item.anio }}°</span>
            <div class="bar" [style.width.%]="(item.cantidad / maxAlumnos) * 100"></div>
            <span>{{ item.cantidad }}</span>
          </div>
        </div>

        <div class="chart-box">
          <h4>Top 5 con más Faltas</h4>
          <ul>
            <li *ngFor="let alumno of topFaltas">{{ alumno.nombre }} - {{ alumno.faltas }} faltas</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 2rem; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .metric-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
    .number { font-size: 2rem; font-weight: bold; color: #007bff; }
    .charts-section { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .chart-box { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .bar-row { display: flex; align-items: center; margin-bottom: 0.5rem; gap: 10px; }
    .bar { height: 20px; background: #28a745; border-radius: 4px; transition: width 0.3s; }
  `]
})
export class DashboardComponent implements OnInit {
  totalAlumnos = 0;
  totalDocentes = 0;
  promedioGeneral = 0;
  alumnosPorAnio: any[] = [];
  maxAlumnos = 1;
  topFaltas: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any>('/panel/resumen').subscribe(data => {
      this.totalAlumnos = data.totales?.alumnos ?? 0;
      this.totalDocentes = data.totales?.docentes ?? 0;

      const promedios = (data.promedioPorCurso || [])
        .map((c: any) => c.promedio_general)
        .filter((p: any) => p != null);
      this.promedioGeneral = promedios.length
        ? Math.round((promedios.reduce((a: number, b: number) => a + b, 0) / promedios.length) * 100) / 100
        : 0;

      this.alumnosPorAnio = (data.alumnosPorAnio || []).map((a: any) => ({ anio: a.anio, cantidad: a.total }));
      this.maxAlumnos = Math.max(1, ...this.alumnosPorAnio.map((a: any) => a.cantidad));

      this.topFaltas = (data.top5Faltas || []).map((a: any) => ({
        nombre: `${a.apellido}, ${a.nombre}`,
        faltas: a.faltas
      }));
    });
  }
}