import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  styles: [`img { width: 100%; height: 160px; object-fit: cover; background: var(--border); }`],
  template: `
    <div class="card">
      <a [routerLink]="['/products', product().id]"><img [src]="product().imageUrl" [alt]="product().name" loading="lazy"></a>
      <div class="card-body col">
        <span class="badge badge-info" style="align-self:flex-start">{{ product().categoryName }}</span>
        <strong>{{ product().name }}</strong>
        <span class="muted">{{ product().description }}</span>
        <div class="row between">
          <strong>{{ product().price | currency:'ARS':'symbol-narrow':'1.0-0' }}</strong>
          @if (product().stock > 0) {
            <button class="btn btn-sm" (click)="add.emit(product())"><i class="bi bi-cart-plus"></i> Agregar</button>
          } @else { <span class="badge badge-danger">Sin stock</span> }
        </div>
      </div>
    </div>`,
})
export class ProductCardComponent { product = input.required<Product>(); add = output<Product>(); }
