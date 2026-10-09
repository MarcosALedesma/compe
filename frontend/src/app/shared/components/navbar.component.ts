import { Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styles: [`
    nav { background: var(--surface); box-shadow: var(--shadow); position: sticky; top: 0; z-index: 10; }
    .brand { font-weight: 700; font-size: 1.2rem; color: var(--primary); }
    .links a { padding: .4rem .7rem; border-radius: 8px; }
    .links a.active { background: var(--bg); color: var(--primary); }
    .cart-badge { background: var(--danger); color: #fff; border-radius: 999px; font-size: .7rem; padding: 0 .4rem; margin-left: .2rem; }
  `],
  template: `
    <nav><div class="container row between" style="padding-block: .8rem">
      <a routerLink="/" class="brand"><i class="bi bi-shop"></i> Tienda</a>
      <div class="row links">
        <a routerLink="/products" routerLinkActive="active">Productos</a>
        @if (auth.isLoggedIn()) {
          <a routerLink="/cart" routerLinkActive="active"><i class="bi bi-cart"></i>
            @if (cart.count() > 0) { <span class="cart-badge">{{ cart.count() }}</span> }
          </a>
          <a routerLink="/orders" routerLinkActive="active">Pedidos</a>
          <span class="muted">{{ auth.user()?.name }}</span>
          <button class="btn btn-outline btn-sm" (click)="auth.logout()">Salir</button>
        } @else {
          <a routerLink="/login" routerLinkActive="active">Ingresar</a>
          <a routerLink="/register" class="btn btn-sm">Registrarse</a>
        }
      </div>
    </div></nav>
  `,
})
export class NavbarComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
  constructor() {
    // Cada vez que cambia la sesión, recarga (o limpia) el carrito
    effect(() => {
      if (this.auth.isLoggedIn()) this.cart.load().subscribe({ error: () => {} });
      else this.cart.reset();
    });
  }
}
