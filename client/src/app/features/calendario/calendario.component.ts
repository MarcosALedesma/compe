import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarioService, Evento } from '../../core/services/calendario.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Calendario Institucional</h1>

      <div class="vista-toggle">
        <button [class.active]="vista === 'lista'" (click)="vista = 'lista'">Vista Lista</button>
        <button [class.active]="vista === 'mes'" (click)="vista = 'mes'">Vista Mensual</button>
      </div>

      <!-- Vista Lista -->
      <div *ngIf="vista === 'lista'" class="lista-eventos">
        <div class="evento-card" *ngFor="let evento of eventos" [ngClass]="evento.tipo">
          <div class="fecha">
            <span class="dia">{{ evento.fecha_inicio | date:'dd' }}</span>
            <span class="mes">{{ evento.fecha_inicio | date:'MMM' }}</span>
          </div>
          <div class="info">
            <h3>{{ evento.titulo }}</h3>
            <p class="tipo-badge">{{ evento.tipo | uppercase }}</p>
            <p class="rango" *ngIf="evento.fecha_inicio !== evento.fecha_fin">
              Del {{ evento.fecha_inicio | date:'dd/MM/yyyy' }} al {{ evento.fecha_fin | date:'dd/MM/yyyy' }}
            </p>
            <p class="curso" *ngIf="evento.curso_id">Curso: {{ evento.curso_id }}°</p>
          </div>
        </div>
        <p *ngIf="eventos.length === 0" class="empty">No hay eventos cargados.</p>
      </div>

      <!-- Vista Mensual -->
      <div *ngIf="vista === 'mes'" class="vista-mensual">
        <div class="mes-header">
          <button (click)="mesAnterior()">◀</button>
          <h2>{{ nombreMes }} {{ anioActual }}</h2>
          <button (click)="mesSiguiente()">▶</button>
        </div>
        <div class="dias-semana">
          <span *ngFor="let d of diasSemana">{{ d }}</span>
        </div>
        <div class="grid-dias">
          <div
            *ngFor="let dia of diasDelMes"
            class="dia-cell"
            [class.vacio]="dia === null"
            [class.hoy]="esHoy(dia)"
            [class.con-evento]="tieneEvento(dia)">
            <span class="num-dia" *ngIf="dia !== null">{{ dia }}</span>
            <div class="puntos" *ngIf="dia !== null">
              <span
                *ngFor="let ev of eventosDelDia(dia)"
                class="punto"
                [ngClass]="ev.tipo"
                [title]="ev.titulo"></span>
            </div>
          </div>
        </div>

        <!-- Detalle del día seleccionado -->
        <div class="detalle-dia" *ngIf="diaSeleccionado !== null && eventosDelDia(diaSeleccionado).length > 0">
          <h3>Eventos del {{ diaSeleccionado }} de {{ nombreMes }}</h3>
          <ul>
            <li *ngFor="let ev of eventosDelDia(diaSeleccionado)">
              <strong>{{ ev.titulo }}</strong> - <em>{{ ev.tipo }}</em>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    h1 { color: #1a237e; margin-bottom: 1.5rem; }

    /* Toggle de vistas */
    .vista-toggle { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .vista-toggle button {
      padding: 0.5rem 1rem; border: 1px solid #1a237e; background: white;
      color: #1a237e; border-radius: 4px; cursor: pointer; transition: all 0.2s;
    }
    .vista-toggle button.active { background: #1a237e; color: white; }
    .vista-toggle button:hover { background: #e8eaf6; }
    .vista-toggle button.active:hover { background: #1a237e; }

    /* Vista Lista */
    .lista-eventos { display: flex; flex-direction: column; gap: 1rem; }
    .evento-card {
      display: flex; gap: 1rem; background: white; padding: 1rem;
      border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #1a237e;
    }
    .evento-card.institucional { border-left-color: #1a237e; }
    .evento-card.acto { border-left-color: #28a745; }
    .evento-card.examen { border-left-color: #dc3545; }
    .fecha {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; background: #f8f9fa; padding: 0.5rem 1rem;
      border-radius: 6px; min-width: 70px;
    }
    .dia { font-size: 1.5rem; font-weight: bold; color: #1a237e; }
    .mes { font-size: 0.75rem; text-transform: uppercase; color: #666; }
    .info h3 { margin: 0 0 0.25rem; }
    .tipo-badge {
      font-size: 0.7rem; background: #e9ecef; padding: 0.15rem 0.5rem;
      border-radius: 10px; display: inline-block; margin: 0;
    }
    .rango { font-size: 0.85rem; color: #666; margin: 0.25rem 0 0; }
    .curso { font-size: 0.85rem; color: #1a237e; font-weight: 600; margin: 0.25rem 0 0; }
    .empty { text-align: center; color: #999; padding: 2rem; }

    /* Vista Mensual */
    .vista-mensual {
      background: white; padding: 1.5rem; border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .mes-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1rem;
    }
    .mes-header h2 { margin: 0; color: #1a237e; text-transform: capitalize; }
    .mes-header button {
      background: #1a237e; color: white; border: none; padding: 0.5rem 1rem;
      border-radius: 4px; cursor: pointer; font-size: 1rem;
    }
    .dias-semana {
      display: grid; grid-template-columns: repeat(7, 1fr);
      text-align: center; font-weight: bold; color: #555;
      padding-bottom: 0.5rem; border-bottom: 1px solid #eee;
      margin-bottom: 0.5rem;
    }
    .grid-dias {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
    }
    .dia-cell {
      min-height: 70px; padding: 0.5rem; border-radius: 6px;
      background: #f8f9fa; position: relative; cursor: pointer;
      transition: background 0.2s;
    }
    .dia-cell:hover:not(.vacio) { background: #e8eaf6; }
    .dia-cell.vacio { background: transparent; cursor: default; }
    .dia-cell.hoy { background: #fff3cd; border: 2px solid #ffc107; }
    .dia-cell.con-evento { background: #e3f2fd; }
    .num-dia { font-size: 0.9rem; font-weight: 600; color: #333; }
    .puntos {
      display: flex; gap: 3px; flex-wrap: wrap; margin-top: 0.5rem;
    }
    .punto {
      width: 8px; height: 8px; border-radius: 50%; display: inline-block;
    }
    .punto.institucional { background: #1a237e; }
    .punto.acto { background: #28a745; }
    .punto.examen { background: #dc3545; }
    .detalle-dia {
      margin-top: 1.5rem; padding: 1rem; background: #f8f9fa;
      border-radius: 6px; border-left: 4px solid #1a237e;
    }
    .detalle-dia h3 { margin: 0 0 0.5rem; color: #1a237e; }
    .detalle-dia ul { margin: 0; padding-left: 1.25rem; }

    /* Responsive */
    @media (max-width: 600px) {
      .container { padding: 1rem; }
      .dia-cell { min-height: 50px; padding: 0.25rem; }
      .num-dia { font-size: 0.75rem; }
      .punto { width: 6px; height: 6px; }
      .evento-card { flex-direction: column; }
      .fecha { flex-direction: row; gap: 0.5rem; padding: 0.25rem 0.5rem; }
    }
  `]
})
export class CalendarioComponent implements OnInit {
  eventos: Evento[] = [];
  vista: 'lista' | 'mes' = 'lista';

  // Propiedades para la vista mensual
  mesActual = new Date().getMonth();
  anioActual = new Date().getFullYear();
  diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  diasDelMes: (number | null)[] = [];
  diaSeleccionado: number | null = null;

  constructor(
    private calendarioService: CalendarioService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.cargarEventos();
    this.generarDiasDelMes();
  }

  cargarEventos() {
    this.calendarioService.getEventos().subscribe({
      next: (data) => {
        this.eventos = data.map(e => ({
          ...e,
          fecha_inicio: e.fecha_inicio,
          fecha_fin: e.fecha_fin
        }));
      },
      error: () => this.toast.error('Error al cargar los eventos')
    });
  }

  // ===== Navegación mensual =====
  get nombreMes(): string {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return meses[this.mesActual];
  }

  mesAnterior() {
    if (this.mesActual === 0) {
      this.mesActual = 11;
      this.anioActual--;
    } else {
      this.mesActual--;
    }
    this.generarDiasDelMes();
    this.diaSeleccionado = null;
  }

  mesSiguiente() {
    if (this.mesActual === 11) {
      this.mesActual = 0;
      this.anioActual++;
    } else {
      this.mesActual++;
    }
    this.generarDiasDelMes();
    this.diaSeleccionado = null;
  }

  generarDiasDelMes() {
    const primerDia = new Date(this.anioActual, this.mesActual, 1).getDay();
    const ultimoDia = new Date(this.anioActual, this.mesActual + 1, 0).getDate();
    const dias: (number | null)[] = [];

    // Espacios vacíos antes del primer día
    for (let i = 0; i < primerDia; i++) {
      dias.push(null);
    }
    // Días del mes
    for (let d = 1; d <= ultimoDia; d++) {
      dias.push(d);
    }
    this.diasDelMes = dias;
  }

  // ===== Helpers de eventos =====
  esHoy(dia: number | null): boolean {
    if (dia === null) return false;
    const hoy = new Date();
    return (
      dia === hoy.getDate() &&
      this.mesActual === hoy.getMonth() &&
      this.anioActual === hoy.getFullYear()
    );
  }

  tieneEvento(dia: number | null): boolean {
    return this.eventosDelDia(dia).length > 0;
  }

  eventosDelDia(dia: number | null): Evento[] {
    if (dia === null) return [];
    return this.eventos.filter(ev => {
      const inicio = new Date(ev.fecha_inicio);
      const fin = new Date(ev.fecha_fin);
      const fecha = new Date(this.anioActual, this.mesActual, dia);
      // Normalizar a medianoche para comparar solo fechas
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(0, 0, 0, 0);
      fecha.setHours(0, 0, 0, 0);
      return fecha >= inicio && fecha <= fin;
    });
  }

  seleccionarDia(dia: number | null) {
    this.diaSeleccionado = dia;
  }
}