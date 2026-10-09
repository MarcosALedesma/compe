import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  get<T>(path: string) {
    return this.http.get<T>(`${this.apiUrl}${path}`, { headers: this.getHeaders() });
  }

  post<T>(path: string, body: any) {
    return this.http.post<T>(`${this.apiUrl}${path}`, body, { headers: this.getHeaders() });
  }

  put<T>(path: string, body: any) {
    return this.http.put<T>(`${this.apiUrl}${path}`, body, { headers: this.getHeaders() });
  }

  delete<T>(path: string) {
    return this.http.delete<T>(`${this.apiUrl}${path}`, { headers: this.getHeaders() });
  }
}