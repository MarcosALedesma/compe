import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Alumno } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AlumnosService {
  constructor(private api: ApiService) {}

  getAlumnos() { return this.api.get<Alumno[]>('/alumnos'); }
  createAlumno(alumno: Alumno) { return this.api.post<Alumno>('/alumnos', alumno); }
  updateAlumno(id: number, alumno: Alumno) { return this.api.put<Alumno>(`/alumnos/${id}`, alumno); }
  deleteAlumno(id: number) { return this.api.delete(`/alumnos/${id}`); }
}