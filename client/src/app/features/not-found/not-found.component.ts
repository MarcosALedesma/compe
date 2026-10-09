import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <div class="content">
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>Lo sentimos, la página que buscás no existe o fue movida.</p>
        <a routerLink="/dashboard" class="btn-home">← Volver al Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex; justify-content: center; align-items: center;
      min-height: 80vh; padding: 2rem; text-align: center;
    }
    .content {
      background: white; padding: 3rem; border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 500px;
    }
    h1 {
      font-size: 6rem; margin: 0; color: #1a237e;
      line-height: 1; font-weight: 800;
    }
    h2 {
      color: #333; margin: 1rem 0 0.5rem;
    }
    p {
      color: #666; margin-bottom: 2rem;
    }
    .btn-home {
      display: inline-block; background: #1a237e; color: white;
      padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none;
      transition: background 0.2s; font-weight: 600;
    }
    .btn-home:hover { background: #283593; }

    @media (max-width: 600px) {
      h1 { font-size: 4rem; }
      .content { padding: 2rem 1rem; }
    }
  `]
})
export class NotFoundComponent {}