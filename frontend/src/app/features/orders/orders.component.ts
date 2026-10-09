import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Order } from '../../core/models/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <h2 class="mb">Mis pedidos</h2>
    @if (loading()) { <div class="spinner"></div> }
    @else if (orders().length === 0) { <p class="muted">Todavía no tenés pedidos.</p> }
    @else {
      <div class="col">
        @for (o of orders(); track o.id) {
          <div class="card card-body">
            <div class="row between">
              <strong>Pedido #{{ o.id }}</strong>
              <span class="badge" [class.badge-warning]="o.status==='pending'" [class.badge-success]="o.status==='paid'||o.status==='shipped'" [class.badge-danger]="o.status==='cancelled'">{{ o.status }}</span>
            </div>
            <span class="muted">{{ o.createdAt | date:'dd/MM/yyyy HH:mm' }} · {{ o.shippingAddress }}</span>
            <ul style="padding-left:1.2rem">@for (i of o.items; track i.productId) { <li>{{ i.quantity }} × {{ i.name }} — {{ i.price | currency:'ARS':'symbol-narrow':'1.0-0' }}</li> }</ul>
            <strong>Total: {{ o.total | currency:'ARS':'symbol-narrow':'1.0-0' }}</strong>
          </div>
        }
      </div>
    }`,
})
export class OrdersComponent implements OnInit {
  private api = inject(ApiService);
  orders = signal<Order[]>([]); loading = signal(true);
  ngOnInit() { this.api.get<Order[]>('/orders').subscribe({ next: (o) => { this.orders.set(o); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
