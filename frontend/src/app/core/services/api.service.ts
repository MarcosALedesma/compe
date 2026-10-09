import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private params(obj?: Record<string, unknown>) {
    let p = new HttpParams();
    Object.entries(obj ?? {}).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v)); });
    return p;
  }
  get<T>(path: string, query?: Record<string, unknown>) { return this.http.get<T>(`${this.base}${path}`, { params: this.params(query) }); }
  post<T>(path: string, body: unknown = {}) { return this.http.post<T>(`${this.base}${path}`, body); }
  put<T>(path: string, body: unknown) { return this.http.put<T>(`${this.base}${path}`, body); }
  patch<T>(path: string, body: unknown) { return this.http.patch<T>(`${this.base}${path}`, body); }
  delete<T>(path: string) { return this.http.delete<T>(`${this.base}${path}`); }
}
