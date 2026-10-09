export interface Usuario {
  id: number;
  email: string;
  rol: 'directivo' | 'docente' | 'alumno';
}

export interface Alumno {
  id: number;
  dni: string;
  apellido: string;
  nombre: string;
  fecha_nac: string;
  tutor: string;
  telefono_tutor: string;
  activo: boolean;
}

export interface Docente {
  id: number;
  dni: string;
  apellido: string;
  nombre: string;
  email: string;
  telefono: string;
}

export interface Curso {
  id: number;
  anio: number;
  division: string;
  turno: 'Mañana' | 'Tarde';
  ciclo_lectivo: number;
}

export interface Materia {
  id: number;
  nombre: string;
  anio: number;
}

export interface Calificacion {
  id?: number;
  alumno_id: number;
  materia_curso_id: number;
  trimestre: number;
  nota: number;
}

export interface Asistencia {
  id?: number;
  alumno_id: number;
  fecha: string;
  estado: 'P' | 'A' | 'T'; // Presente, Ausente, Tarde
}