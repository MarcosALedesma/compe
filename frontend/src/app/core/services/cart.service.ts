import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from './api.service';
import { Cart } from '../models/models';

// Estado compartido del carrito con signals. El total lo calcula el back.
@Injectable({ providedIn: 'root' })
export class CartService {
  private api = inject(ApiService);
  private cart = signal<Cart>({ items: [], total: 0, count: 0 });

  items = computed(() => this.cart().items);
  total = computed(() => this.cart().total);
  count = computed(() => this.cart().count);

  load() { return this.api.get<Cart>('/cart').pipe(tap((c) => this.cart.set(c))); }
  add(productId: number, quantity = 1) { return this.api.post<Cart>('/cart/items', { productId, quantity }).pipe(tap((c) => this.cart.set(c))); }
  setQuantity(itemId: number, quantity: number) { return this.api.patch<Cart>(`/cart/items/${itemId}`, { quantity }).pipe(tap((c) => this.cart.set(c))); }
  remove(itemId: number) { return this.api.delete<Cart>(`/cart/items/${itemId}`).pipe(tap((c) => this.cart.set(c))); }
  clear() { return this.api.delete<Cart>('/cart').pipe(tap((c) => this.cart.set(c))); }
  reset() { this.cart.set({ items: [], total: 0, count: 0 }); }
}
