import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

// Interfaz para tipar las notas que vienen del backend
interface NotaAlumno {
  materia: string;
  trim1: number | null;
  trim2: number | null;
  trim3: number | null;
  promedio: number | null;
}

@Component({
  selector: 'app-portal-alumno',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="header-portal">
        <h1>Mi Portal</h1>
        <p class="subtitulo">Bienvenido/a, {{ nombreAlumno }}</p>
      </div>

      <div class="card">
        <h2>Mis Notas</h2>
        <div *ngIf="cargando" class="loading">Cargando notas...</div>
        
        <table class="table" *ngIf="!cargando && notas.length > 0">
          <thead>
            <tr>
              <th>Materia</th>
              <th>1° Trim</th>
              <th>2° Trim</th>
              <th>3° Trim</th>
              <th>Promedio</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let nota of notas">
              <td>{{ nota.materia }}</td>
              <td>{{ nota.trim1 !== null ? nota.trim1 : '-' }}</td>
              <td>{{ nota.trim2 !== null ? nota.trim2 : '-' }}</td>
              <td>{{ nota.trim3 !== null ? nota.trim3 : '-' }}</td>
              <td>
                <strong [ngClass]="{
                  'aprobado': nota.promedio !== null && nota.promedio >= 6,
                  'desaprobado': nota.promedio !== null && nota.promedio < 6
                }">
                  {{ nota.promedio !== null ? nota.promedio : 'Sin promedio' }}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
        
        <p *ngIf="!cargando && notas.length === 0" class="empty-msg">No hay notas cargadas aún.</p>
      </div>
      
      <div class="card">
        <h2>Mis Faltas</h2>
        <div *ngIf="cargando" class="loading">Cargando asistencias...</div>
        <p *ngIf="!cargando">Total de inasistencias: <strong class="faltas-num">{{ totalFaltas }}</strong></p>
        <p *ngIf="!cargando && totalFaltas >= 20" class="alerta-faltas">
          ⚠️ Atención: Has superado el límite de 20 faltas.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .container { 
      padding: 2rem; 
      max-width: 1000px; 
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .header-portal {
      margin-bottom: 2rem;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 1rem;
    }
    .header-portal h1 {
      margin: 0;
      color: #333;
    }
    .subtitulo {
      color: #666;
      margin-top: 0.5rem;
    }
    .card { 
      background: white; 
      padding: 1.5rem; 
      border-radius: 8px; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
      margin-bottom: 2rem; 
    }
    .card h2 {
      margin-top: 0;
      color: #007bff;
      font-size: 1.25rem;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.5rem;
    }
    .table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 1rem;
    }
    .table th, .table td { 
      padding: 0.75rem; 
      text-align: left; 
      border-bottom: 1px solid #eee;
    }
    .table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #555;
    }
    .table tr:hover {
      background-color: #f1f1f1;
    }
    .aprobado { color: #28a745; }
    .desaprobado { color: #dc3545; }
    .faltas-num {
      font-size: 1.5rem;
      color: #dc3545;
    }
    .alerta-faltas {
      color: #dc3545;
      font-weight: bold;
      background: #f8d7da;
      padding: 0.75rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    .loading {
      color: #666;
      font-style: italic;
    }
    .empty-msg {
      color: #999;
      text-align: center;
      padding: 1rem;
    }
    
    /* Responsive para celular (360px) */
    @media (max-width: 600px) {
      .container { padding: 1rem; }
      .table th, .table td { 
        padding: 0.5rem; 
        font-size: 0.85rem;
      }
      .card { padding: 1rem; }
    }
  `]
})
export class PortalAlumnoComponent implements OnInit {
  notas: NotaAlumno[] = [];
  totalFaltas = 0;
  nombreAlumno = '';
  cargando = true;

  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Obtenemos el nombre del alumno desde el usuario logueado
    const user = this.auth.getUser();
    if (user) {
      this.nombreAlumno = user.nombre || user.email;
    }

    this.cargarDatosPortal();
  }

  cargarDatosPortal(): void {
    this.cargando = true;
    
    // Asumimos que el backend expone un endpoint que devuelve todo junto
    // Si tu backend tiene endpoints separados, podés usar forkJoin de RxJS
    this.api.get<any>('/alumnos/mi-portal').subscribe({
      next: (data) => {
        // Mapeamos la respuesta del backend a nuestra interfaz
        // Ajustá esto según cómo devuelva los datos tu API
        this.notas = data.notas.map((n: any) => ({
          materia: n.materia,
          trim1: n.trim1 ?? null,
          trim2: n.trim2 ?? null,
          trim3: n.trim3 ?? null,
          promedio: n.promedio ?? null
        }));
        
        this.totalFaltas = data.totalFaltas || 0;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del portal:', err);
        this.cargando = false;
        // Opcional: mostrar un toast de error
      }
    });
  }
}