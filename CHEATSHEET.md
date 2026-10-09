# Cheatsheet

## Git (equipo de 2)
```bash
git pull                     # antes de empezar y antes de push
git add . && git commit -m "feat(back): carrito"
git push
git status / git log --oneline -5
git stash / git stash pop    # guardar cambios para poder hacer pull
```

## Angular CLI
```bash
bunx ng g c features/turnos/turno-list --standalone    # componente
bunx ng g s core/services/turnos                        # servicio
bunx ng g guard core/guards/admin  / bunx ng g pipe shared/pipes/xyz
bunx ng build --configuration development
```

## Angular — sintaxis
```html
@if (x()) { ... } @else { ... }
@for (item of items(); track item.id) { ... } @empty { <p>Sin datos</p> }
<input [(ngModel)]="texto">                 <!-- FormsModule -->
<form [formGroup]="form" (ngSubmit)="go()"> <input formControlName="email">
<button (click)="fn()" [disabled]="loading()">
{{ precio | currency:'ARS':'symbol-narrow':'1.0-0' }}   {{ fecha | date:'dd/MM/yyyy' }}
```
```ts
x = signal(0);  x.set(1);  x.update(v => v + 1);  doble = computed(() => this.x() * 2);
id = input.required<string>();   cambio = output<Product>();   // @Input/@Output nuevos
effect(() => console.log(this.x()));
private api = inject(ApiService);
```
Validators: `Validators.required, email, minLength(6), pattern(/regex/)`.
Validador custom: `(c: AbstractControl) => c.value === 'x' ? { prohibido: true } : null`.

## Express — CRUD base
```js
router.get('/', wrap(ctrl.list));
router.post('/', auth, role('admin'), [body('name').notEmpty()], validate, wrap(ctrl.create));
// controller: lanzar errores con  throw new HttpError(404, 'No existe')
```

## SQLite (better-sqlite3)
```js
db.prepare('SELECT * FROM t WHERE id = ?').get(id);     // 1 fila
db.prepare('SELECT * FROM t').all();                    // varias
db.prepare('INSERT INTO t (a,b) VALUES (?,?)').run(a, b).lastInsertRowid;
const tx = db.transaction(() => { /* varias operaciones */ });
```

## Proyectos típicos → entidades
- **Turnos**: User, Service, Professional, Appointment(date, time, status) — validar que no se superpongan.
- **To-do**: User, List, Task(done, dueDate, priority).
- **Blog**: User, Post, Comment, Tag.
- **Biblioteca**: Book, Member, Loan(dueDate, returnedAt).
- **Inventario**: Product, Movement(type in/out, qty), Supplier.

## Checklist final antes de entregar
- [ ] README con cómo correrlo · [ ] seed con datos · [ ] validaciones front y back
- [ ] estados de carga y error · [ ] responsive (probar en 400px) · [ ] sin console.log ni claves en el repo
