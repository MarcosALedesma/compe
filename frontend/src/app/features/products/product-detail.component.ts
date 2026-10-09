import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    @if (product(); as p) {
      <div class="card"><div class="card-body row wrap" style="align-items:flex-start">
        <img [src]="p.imageUrl" [alt]="p.name" style="width:340px;max-width:100%;border-radius:10px">
        <div class="col" style="flex:1;min-width:240px">
          <h2>{{ p.name }}</h2>
          <p class="muted">{{ p.description }}</p>
          <h3>{{ p.price | currency:'ARS':'symbol-narrow':'1.0-0' }}</h3>
          <p>Stock: {{ p.stock }}</p>
          <button class="btn" [disabled]="p.stock === 0" (click)="add(p)"><i class="bi bi-cart-plus"></i> Agregar al carrito</button>
        </div>
      </div></div>
    } @else { <div class="spinner"></div> }
  `,
})
export class ProductDetailComponent implements OnInit {
  id = input.required<string>(); // viene de la ruta gracias a withComponentInputBinding
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);
  product = signal<Product | null>(null);

  ngOnInit() { this.api.get<Product>(`/products/${this.id()}`).subscribe({ next: (p) => this.product.set(p), error: () => this.router.navigate(['/products']) }); }
  add(p: Product) {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    this.cart.add(p.id).subscribe(() => this.toast.success('Agregado al carrito'));
  }
}
