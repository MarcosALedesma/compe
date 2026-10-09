import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface Evento {
  id: number;
  titulo: string;
  tipo: 'institucional' | 'acto' | 'examen';
  fecha_inicio: string;
  fecha_fin: string;
  curso_id?: number;
}

@Injectable({ providedIn: 'root' })
export class CalendarioService {
  constructor(private api: ApiService) {}

  getEventos() { return this.api.get<Evento[]>('/eventos'); }
  createEvento(evento: Evento) { return this.api.post<Evento>('/eventos', evento); }
  updateEvento(id: number, evento: Evento) { return this.api.put<Evento>(`/eventos/${id}`, evento); }
  deleteEvento(id: number) { return this.api.delete(`/eventos/${id}`); }
}