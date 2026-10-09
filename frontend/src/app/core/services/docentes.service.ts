import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Docente } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DocentesService {
  constructor(private api: ApiService) {}

  getDocentes() { return this.api.get<Docente[]>('/docentes'); }
  createDocente(docente: Docente) { return this.api.post<Docente>('/docentes', docente); }
  updateDocente(id: number, docente: Docente) { return this.api.put<Docente>(`/docentes/${id}`, docente); }
  deleteDocente(id: number) { return this.api.delete(`/docentes/${id}`); }
}