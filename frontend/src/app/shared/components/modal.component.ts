import { Component, input, output } from '@angular/core';

// Uso: <app-modal title="Confirmar" (closed)="open=false"> contenido </app-modal>
@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="modal-backdrop" (click)="closed.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="row between mb"><h3>{{ title() }}</h3><button class="btn btn-sm btn-outline" (click)="closed.emit()">✕</button></div>
        <ng-content />
      </div>
    </div>`,
})
export class ModalComponent { title = input(''); closed = output<void>(); }
