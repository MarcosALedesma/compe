import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Category, Page, Product } from '../../core/models/models';
import { ProductCardComponent } from '../../shared/components/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, ProductCardComponent],
  template: `
    <div class="row wrap mb">
      <input class="input" style="max-width:260px" placeholder="Buscar..." [ngModel]="search" (ngModelChange)="search$.next($event)">
      <select class="input" style="max-width:200px" [(ngModel)]="category" (change)="reset()">
        <option value="">Todas las categorías</option>
        @for (c of categories(); track c.id) { <option [value]="c.slug">{{ c.name }}</option> }
      </select>
      <select class="input" style="max-width:200px" [(ngModel)]="sort" (change)="reset()">
        <option value="newest">Más nuevos</option><option value="price_asc">Menor precio</option>
        <option value="price_desc">Mayor precio</option><option value="name">Nombre A-Z</option>
      </select>
    </div>
    @if (loading()) { <div class="spinner"></div> }
    @else if (products().length === 0) { <p class="center muted">No se encontraron productos.</p> }
    @else {
      <div class="grid">@for (p of products(); track p.id) { <app-product-card [product]="p" (add)="addToCart($event)" /> }</div>
      <div class="row mt" style="justify-content:center">
        <button class="btn btn-outline btn-sm" [disabled]="page() <= 1" (click)="go(page() - 1)">Anterior</button>
        <span>Página {{ page() }} de {{ totalPages() }}</span>
        <button class="btn btn-outline btn-sm" [disabled]="page() >= totalPages()" (click)="go(page() + 1)">Siguiente</button>
      </div>
    }
  `,
})
export class ProductListComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);
  search = ''; category = ''; sort = 'newest';
  search$ = new Subject<string>();

  ngOnInit() {
    this.api.get<Category[]>('/categories').subscribe((c) => this.categories.set(c));
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((v) => { this.search = v; this.reset(); });
    this.load();
  }
  reset() { this.page.set(1); this.load(); }
  go(p: number) { this.page.set(p); this.load(); }
  load() {
    this.loading.set(true);
    this.api.get<Page<Product>>('/products', { search: this.search, category: this.category, sort: this.sort, page: this.page(), limit: 8 })
      .subscribe({ next: (r) => { this.products.set(r.data); this.totalPages.set(r.totalPages || 1); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
  addToCart(p: Product) {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    this.cart.add(p.id).subscribe(() => this.toast.success(`${p.name} agregado al carrito`));
  }
}
