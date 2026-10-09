import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null {
    try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
  }
  set(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }
  remove(key: string) { localStorage.removeItem(key); }
}
