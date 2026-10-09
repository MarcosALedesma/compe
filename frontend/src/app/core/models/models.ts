export type Rol = 'director' | 'docente' | 'alumno';

export interface User {
  id: number;
  email: string;
  rol: Rol;
  nombre?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}