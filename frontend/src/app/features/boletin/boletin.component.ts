import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AlumnosService } from '../../core/services/alumnos.service';
import { ToastService } from '../../core/services/toast.service';
import { Alumno } from '../../core/models/models';

interface FilaBoletin {
  materia: string;
  trim1: number | null;
  trim2: number | null;
  trim3: number | null;
  promedio: number | null;
  estado: 'Aprobado' | 'Diciembre' | 'Febrero' | 'Sin datos';
}

@Component({
  selector: 'app-boletin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="no-print">
        <h1>Boletín de Calificaciones</h1>

        <div class="toolbar">
          <select [(ngModel)]="alumnoSeleccionado" (change)="cargarBoletin()">
            <option [ngValue]="null">Seleccione un alumno...</option>
            <option *ngFor="let a of alumnos" [ngValue]="a.id">
              {{ a.apellido }}, {{ a.nombre }} - DNI {{ a.dni }}
            </option>
          </select>
          <button
            *ngIf="filas.length > 0"
            (click)="imprimir()"
            class="btn-print">
            🖨️ Imprimir / Exportar PDF
          </button>
        </div>
      </div>

      <div *ngIf="cargando" class="loading">Cargando boletín...</div>

      <!-- Área imprimible -->
      <div class="boletin" *ngIf="!cargando && filas.length > 0" id="boletin-print">
        <div class="header-boletin">
          <div class="escuela">
            <h2>E.E.T.P. N° 602 "General José de San Martín"</h2>
            <p>San Martín 2260 - Venado Tuerto, Santa Fe</p>
          </div>
          <div class="ciclo">
            <p><strong>Ciclo Lectivo:</strong> {{ cicloLectivo }}</p>
            <p><strong>Fecha de emisión:</strong> {{ fechaEmision | date:'dd/MM/yyyy' }}</p>
          </div>
        </div>

        <div class="datos-alumno">
          <p><strong>Alumno:</strong> {{ alumnoActual?.apellido }}, {{ alumnoActual?.nombre }}</p>
          <p><strong>DNI:</strong> {{ alumnoActual?.dni }}</p>
          <p><strong>Curso:</strong> {{ cursoActual }}</p>
        </div>

        <table class="tabla-boletin">
          <thead>
            <tr>
              <th>Materia</th>
              <th>1° Trim.</th>
              <th>2° Trim.</th>
              <th>3° Trim.</th>
              <th>Promedio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let fila of filas">
              <td class="materia">{{ fila.materia }}</td>
              <td>{{ fila.trim1 !== null ? fila.trim1 : '-' }}</td>
              <td>{{ fila.trim2 !== null ? fila.trim2 : '-' }}</td>
              <td>{{ fila.trim3 !== null ? fila.trim3 : '-' }}</td>
              <td>
                <strong>{{ fila.promedio !== null ? fila.promedio : '-' }}</strong>
              </td>
              <td>
                <span class="estado" [ngClass]="{
                  'aprobado': fila.estado === 'Aprobado',
                  'diciembre': fila.estado === 'Diciembre',
                  'febrero': fila.estado === 'Febrero',
                  'sin-datos': fila.estado === 'Sin datos'
                }">
                  {{ fila.estado }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="footer-boletin">
          <div class="firma">
            <div class="linea-firma"></div>
            <p>Firma y Sello Dirección</p>
          </div>
          <div class="firma">
            <div class="linea-firma"></div>
            <p>Firma del Tutor</p>
          </div>
        </div>

        <p class="leyenda">
          <strong>Referencias:</strong>
          Aprobado (promedio ≥ 6) · Diciembre (4 a 5,99) · Febrero (menor a 4)
        </p>
      </div>

      <p *ngIf="!cargando && alumnoSeleccionado && filas.length === 0" class="empty">
        Este alumno no tiene calificaciones cargadas.
      </p>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1100px; margin: 0 auto; }
    h1 { color: #1a237e; margin-bottom: 1.5rem; }
    .toolbar {
      display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;
      align-items: center;
    }
    .toolbar select {
      padding: 0.6rem 1rem; border: 1px solid #ccc; border-radius: 4px;
      font-size: 1rem; min-width: 320px; flex: 1; max-width: 500px;
    }
    .btn-print {
      background: #1a237e; color: white; border: none; padding: 0.6rem 1.2rem;
      border-radius: 4px; cursor: pointer; font-size: 1rem;
    }
    .btn-print:hover { background: #283593; }
    .loading { text-align: center; color: #666; padding: 2rem; }
    .empty { text-align: center; color: #999; padding: 2rem; }

    /* Boletín */
    .boletin {
      background: white; padding: 2.5rem; border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header-boletin {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 3px double #1a237e; padding-bottom: 1rem; margin-bottom: 1.5rem;
      flex-wrap: wrap; gap: 1rem;
    }
    .escuela h2 { margin: 0; color: #1a237e; font-size: 1.2rem; }
    .escuela p { margin: 0.25rem 0 0; font-size: 0.85rem; color: #555; }
    .ciclo p { margin: 0.25rem 0; font-size: 0.9rem; text-align: right; }

    .datos-alumno {
      background: #f8f9fa; padding: 1rem; border-radius: 6px;
      margin-bottom: 1.5rem; display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;
    }
    .datos-alumno p { margin: 0; font-size: 0.95rem; }

    .tabla-boletin {
      width: 100%; border-collapse: collapse; margin-bottom: 2rem;
    }
    .tabla-boletin th, .tabla-boletin td {
      padding: 0.75rem; border: 1px solid #ddd; text-align: center;
    }
    .tabla-boletin th {
      background: #1a237e; color: white; font-weight: 600;
    }
    .tabla-boletin .materia {
      text-align: left; font-weight: 500;
    }
    .tabla-boletin tbody tr:nth-child(even) { background: #f8f9fa; }

    .estado {
      padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.8rem;
      font-weight: 600; display: inline-block;
    }
    .estado.aprobado { background: #d4edda; color: #155724; }
    .estado.diciembre { background: #fff3cd; color: #856404; }
    .estado.febrero { background: #f8d7da; color: #721c24; }
    .estado.sin-datos { background: #e9ecef; color: #6c757d; }

    .footer-boletin {
      display: flex; justify-content: space-around; margin-top: 3rem;
      flex-wrap: wrap; gap: 2rem;
    }
    .firma { text-align: center; min-width: 200px; }
    .linea-firma {
      border-top: 1px solid #333; margin-bottom: 0.5rem; height: 40px;
    }
    .firma p { margin: 0; font-size: 0.85rem; color: #555; }

    .leyenda {
      margin-top: 2rem; font-size: 0.8rem; color: #666;
      border-top: 1px solid #eee; padding-top: 1rem;
    }

    /* ===== Estilos de impresión ===== */
    @media print {
      .no-print { display: none !important; }
      .container { padding: 0; max-width: 100%; }
      .boletin {
        box-shadow: none; padding: 0; border-radius: 0;
      }
      .header-boletin { border-bottom-color: #000; }
      .escuela h2 { color: #000; }
      .tabla-boletin th { background: #ddd !important; color: #000 !important; -webkit-print-color-adjust: exact; }
      .estado { border: 1px solid #333; }
      @page { size: A4; margin: 1.5cm; }
    }

    @media (max-width: 600px) {
      .container { padding: 1rem; }
      .boletin { padding: 1rem; }
      .tabla-boletin th, .tabla-boletin td { padding: 0.4rem; font-size: 0.85rem; }
      .header-boletin { flex-direction: column; }
      .ciclo p { text-align: left; }
    }
  `]
})
export class BoletinComponent implements OnInit {
  alumnos: Alumno[] = [];
  alumnoSeleccionado: number | null = null;
  alumnoActual: Alumno | null = null;
  cursoActual = '';
  filas: FilaBoletin[] = [];
  cargando = false;
  cicloLectivo = new Date().getFullYear();
  fechaEmision = new Date();

  constructor(
    private api: ApiService,
    private alumnosService: AlumnosService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.cargarAlumnos();
  }

  cargarAlumnos() {
    this.alumnosService.getAlumnos().subscribe({
      next: (data) => (this.alumnos = data),
      error: () => this.toast.error('Error al cargar alumnos')
    });
  }

  cargarBoletin() {
    if (!this.alumnoSeleccionado) {
      this.filas = [];
      this.alumnoActual = null;
      return;
    }

    this.cargando = true;
    this.alumnoActual = this.alumnos.find(a => a.id === this.alumnoSeleccionado) || null;
    this.cursoActual = this.alumnoActual?.curso
      ? `${this.alumnoActual.curso.anio}° ${this.alumnoActual.curso.division} - Turno ${this.alumnoActual.curso.turno}`
      : 'Sin curso asignado';

    // El backend debe devolver las notas agrupadas por materia con sus 3 trimestres
    this.api.get<any[]>(`/alumnos/${this.alumnoSeleccionado}/boletin`).subscribe({
      next: (data) => {
        this.filas = data.map(item => this.calcularFila(item));
        this.cargando = false;
      },
      error: () => {
        this.toast.error('Error al cargar el boletín');
        this.filas = [];
        this.cargando = false;
      }
    });
  }

  /**
   * Calcula promedio y estado según las reglas del Excel:
   * - Promedio = promedio de los 3 trimestres (solo de los que tienen nota)
   * - Aprobado: ≥ 6
   * - Diciembre: entre 4 y 5,99
   * - Febrero: < 4
   */
  private calcularFila(item: any): FilaBoletin {
    const trim1 = item.trim1 ?? null;
    const trim2 = item.trim2 ?? null;
    const trim3 = item.trim3 ?? null;

    const notasValidas = [trim1, trim2, trim3].filter(n => n !== null) as number[];
    const promedio = notasValidas.length > 0
      ? Number((notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(2))
      : null;

    let estado: FilaBoletin['estado'] = 'Sin datos';
    if (promedio !== null) {
      if (promedio >= 6) estado = 'Aprobado';
      else if (promedio >= 4) estado = 'Diciembre';
      else estado = 'Febrero';
    }

    return {
      materia: item.materia,
      trim1,
      trim2,
      trim3,
      promedio,
      estado
    };
  }

  imprimir() {
    window.print();
  }
}