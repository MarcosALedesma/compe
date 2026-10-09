# Contrato de la API  (base: `/api`)

**Formato de error (siempre):** `{ "error": { "message": "texto", "details": [{ "field": "email", "message": "Email inválido" }] } }`
**Auth:** header `Authorization: Bearer <token>`. Códigos: 400 validación · 401 sin sesión · 403 sin permisos · 404 no existe · 409 duplicado.

## Auth
| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | /auth/register | `{ name, email, password }` | 201 `{ token, user }` |
| POST | /auth/login | `{ email, password }` | 200 `{ token, user }` |
| GET | /auth/me 🔒 | — | `{ id, name, email, role }` |

## Productos
| Método | Ruta | Notas |
|---|---|---|
| GET | /products?search=&category=slug&sort=&page=&limit= | `sort`: newest, price_asc, price_desc, name → `{ data: Product[], page, limit, total, totalPages }` |
| GET | /products/:id | `Product` |
| POST | /products 🔒admin | `{ name, price, stock?, description?, imageUrl?, categoryId? }` → 201 |
| PUT | /products/:id 🔒admin | campos a modificar |
| DELETE | /products/:id 🔒admin | baja lógica → 204 |
| GET | /categories | `[{ id, name, slug }]` |

`Product = { id, name, description, price, stock, imageUrl, categoryId, categoryName, active }`

## Carrito 🔒
Todas devuelven `Cart = { items: [{ id, productId, name, price, imageUrl, stock, quantity, subtotal }], total, count }`
| Método | Ruta | Body |
|---|---|---|
| GET | /cart | — |
| POST | /cart/items | `{ productId, quantity? }` (suma si ya existe; valida stock) |
| PATCH | /cart/items/:id | `{ quantity }` |
| DELETE | /cart/items/:id | — |
| DELETE | /cart | vacía el carrito |

## Pedidos 🔒
`Order = { id, userId, total, status, shippingAddress, createdAt, items: [{ productId, name, price, quantity }] }`
| Método | Ruta | Notas |
|---|---|---|
| POST | /orders | `{ shippingAddress }` — checkout: valida stock, crea pedido (con snapshot de nombre/precio), descuenta stock, vacía carrito |
| GET | /orders | mis pedidos (admin: todos) |
| GET | /orders/:id | |
| PATCH | /orders/:id/status 🔒admin | `{ status }`: pending, paid, shipped, cancelled |
