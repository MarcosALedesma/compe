import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  { path: 'products', loadComponent: () => import('./features/products/product-list.component').then((m) => m.ProductListComponent) },
  { path: 'products/:id', loadComponent: () => import('./features/products/product-detail.component').then((m) => m.ProductDetailComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent) },
  { path: 'cart', canActivate: [authGuard], loadComponent: () => import('./features/cart/cart.component').then((m) => m.CartComponent) },
  { path: 'orders', canActivate: [authGuard], loadComponent: () => import('./features/orders/orders.component').then((m) => m.OrdersComponent) },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent) },
];
