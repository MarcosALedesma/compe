import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  styles: [`.wrap { position: fixed; right: 1rem; bottom: 1rem; display: flex; flex-direction: column; gap: .5rem; z-index: 200; } .alert { box-shadow: var(--shadow); min-width: 240px; }`],
  template: `<div class="wrap">@for (t of toast.toasts(); track t.id) { <div class="alert" [class.alert-danger]="t.type==='danger'" [class.alert-success]="t.type==='success'">{{ t.message }}</div> }</div>`,
})
export class ToastComponent { toast = inject(ToastService); }
