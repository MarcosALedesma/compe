# Plantilla competencia — Angular + Express

Ejemplo completo: **tienda con carrito** (auth JWT, productos, carrito, checkout con transacción, pedidos).
Sirve de base para cualquier consigna: copiás, renombrás entidades y listo.

## Puesta en marcha (hacerlo ANTES de la competencia)

```bash
# 1) Dependencias
bun run install:all                 # raíz + backend + frontend

# 2) Datos de prueba (crea backend/data/app.db)
bun run seed

# 3) Levantar todo (back :3000 + front :4200 con proxy a /api)
bun run dev
```

Usuarios de prueba: `admin@test.com / admin123` · `user@test.com / user123`

## Estructura

```
backend/   Express + SQLite (bun:sqlite, viene con Bun), JWT, express-validator
  src/{config,controllers,routes,middlewares,utils,seed}
frontend/  Angular 18 (standalone, signals, control flow @if/@for)
  src/app/{core,shared,features}
API.md     Contrato de la API (acordar con el compañero)
CHEATSHEET.md  Comandos y snippets que se olvidan
```

## Cómo adaptarlo a otra consigna
1. **Modelo de datos**: editar `backend/src/config/db.js` (tablas) y `seed/seed.js`.
2. **Back**: copiar `products.controller.js` como CRUD base → nuevo controller + rutas en `routes/index.js`.
3. **Front**: copiar `features/products/` → nueva feature, agregar ruta en `app.routes.ts`.
4. Reutilizar tal cual: auth, interceptors, guards, `ApiService`, toast, modal, estilos de `styles.css`.

## Notas
- **Bun + Node**: el back corre con Bun (usa `bun:sqlite`, no funciona con Node). El Angular CLI sí necesita **Node instalado** (18.19+ / 20.11+ / 22) además de Bun. Mismo `bun -v` y `node -v` en ambas compus. Probado con Bun 1.4 y Node 22.
- **Comandos del CLI de Angular**: `bunx ng generate component ...` (o `bun run ng ...`).
- **Build de producción** (`ng build`): ya viene con la inlineación de fuentes desactivada, así que funciona sin internet. La fuente Inter se carga por Google Fonts en `index.html` (si no hay internet cae a la fuente del sistema).
- **Imágenes** del seed vienen de picsum.photos (requiere internet). Sin internet se ve el gris de fondo; cambiá `image_url` en el seed por rutas locales si hace falta.
- **Iconos**: Bootstrap Icons instalados localmente (`bun install` los trae, ya están en `angular.json`). Uso: `<i class="bi bi-cart"></i>`. Funcionan sin internet.
- `.env` está en `.gitignore`; el repo trae `.env.example`.
