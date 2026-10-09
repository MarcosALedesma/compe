import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Order } from '../../core/models/models';
import { ModalComponent } from '../../shared/components/modal.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink, ModalComponent],
  template: `
    <h2 class="mb">Mi carrito</h2>
    @if (cart.items().length === 0) {
      <div class="card card-body center"><p class="muted mb">Tu carrito está vacío.</p><a routerLink="/products" class="btn" style="align-self:center">Ver productos</a></div>
    } @else {
      <table class="table">
        <thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>
          @for (i of cart.items(); track i.id) {
            <tr>
              <td>{{ i.name }}</td>
              <td>{{ i.price | currency:'ARS':'symbol-narrow':'1.0-0' }}</td>
              <td class="row">
                <button class="btn btn-sm btn-outline" [disabled]="i.quantity <= 1" (click)="change(i.id, i.quantity - 1)">−</button>
                {{ i.quantity }}
                <button class="btn btn-sm btn-outline" [disabled]="i.quantity >= i.stock" (click)="change(i.id, i.quantity + 1)">+</button>
              </td>
              <td>{{ i.subtotal | currency:'ARS':'symbol-narrow':'1.0-0' }}</td>
              <td><button class="btn btn-sm btn-danger" (click)="cart.remove(i.id).subscribe()"><i class="bi bi-trash"></i></button></td>
            </tr>
          }
        </tbody>
      </table>
      <div class="row between mt">
        <button class="btn btn-outline" (click)="cart.clear().subscribe()">Vaciar carrito</button>
        <div class="row"><h3>Total: {{ cart.total() | currency:'ARS':'symbol-narrow':'1.0-0' }}</h3><button class="btn" (click)="checkoutOpen.set(true)">Finalizar compra</button></div>
      </div>
    }
    @if (checkoutOpen()) {
      <app-modal title="Datos de envío" (closed)="checkoutOpen.set(false)">
        <div class="field mb"><label>Dirección</label><input class="input" [(ngModel)]="address" placeholder="Calle 123, Ciudad"></div>
        <button class="btn btn-block" [disabled]="!address.trim() || sending()" (click)="checkout()">Confirmar pedido</button>
      </app-modal>
    }`,
})
export class CartComponent implements OnInit {
  cart = inject(CartService);
  private api = inject(ApiService); private toast = inject(ToastService); private router = inject(Router);
  checkoutOpen = signal(false); sending = signal(false); address = '';

  ngOnInit() { this.cart.load().subscribe(); }
  change(id: number, q: number) { this.cart.setQuantity(id, q).subscribe(); }
  checkout() {
    this.sending.set(true);
    this.api.post<Order>('/orders', { shippingAddress: this.address }).subscribe({
      next: () => { this.cart.reset(); this.toast.success('¡Pedido realizado!'); this.router.navigate(['/orders']); },
      error: () => this.sending.set(false),
    });
  }
}
