import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `<div class="center"><h1 style="font-size:4rem">404</h1><p class="muted mb">La página no existe.</p><a routerLink="/" class="btn">Volver al inicio</a></div>`,
})
export class NotFoundComponent {}
