import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; type: 'success' | 'danger' | 'info'; message: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 1;

  show(message: string, type: Toast['type'] = 'info', ms = 3000) {
    const id = this.nextId++;
    this.toasts.update((t) => [...t, { id, type, message }]);
    setTimeout(() => this.toasts.update((t) => t.filter((x) => x.id !== id)), ms);
  }
  success(m: string) { this.show(m, 'success'); }
  error(m: string) { this.show(m, 'danger', 4500); }
}
