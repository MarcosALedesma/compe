import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Curso } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CursosService {
  constructor(private api: ApiService) {}

  getCursos() { return this.api.get<Curso[]>('/cursos'); }
  createCurso(curso: Curso) { return this.api.post<Curso>('/cursos', curso); }
  updateCurso(id: number, curso: Curso) { return this.api.put<Curso>(`/cursos/${id}`, curso); }
  deleteCurso(id: number) { return this.api.delete(`/cursos/${id}`); }
}