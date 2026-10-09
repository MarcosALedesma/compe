import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts$ | async" class="toast" [ngClass]="toast.type">
        <span>{{ toast.message }}</span>
        <button (click)="toastService.remove(toast.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 80px; right: 20px; z-index: 2000;
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .toast {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1rem; border-radius: 6px; color: white;
      min-width: 250px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    }
    .toast.success { background: #28a745; }
    .toast.error { background: #dc3545; }
    .toast.info { background: #17a2b8; }
    .toast button {
      background: none; border: none; color: white; font-size: 1.2rem;
      cursor: pointer; margin-left: 1rem;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  toasts$ = this.toastService.toasts$;
  constructor(public toastService: ToastService) {}
}