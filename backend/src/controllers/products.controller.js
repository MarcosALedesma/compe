const db = require('../config/db');
const HttpError = require('../utils/httpError');

const map = (p) => ({
  id: p.id, name: p.name, description: p.description, price: p.price, stock: p.stock,
  imageUrl: p.image_url, categoryId: p.category_id, categoryName: p.category_name, active: !!p.active,
});

const SORTS = { price_asc: 'p.price ASC', price_desc: 'p.price DESC', name: 'p.name ASC', newest: 'p.id DESC' };

exports.list = (req, res) => {
  const { search = '', category, sort = 'newest' } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 100);
  const where = ['p.active = 1'];
  const params = [];
  if (search) { where.push('(p.name LIKE ? OR p.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (category) { where.push('c.slug = ?'); params.push(category); }
  const from = `FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(' AND ')}`;
  const total = db.prepare(`SELECT COUNT(*) n ${from}`).get(...params).n;
  const rows = db
    .prepare(`SELECT p.*, c.name category_name ${from} ORDER BY ${SORTS[sort] || SORTS.newest} LIMIT ? OFFSET ?`)
    .all(...params, limit, (page - 1) * limit);
  res.json({ data: rows.map(map), page, limit, total, totalPages: Math.ceil(total / limit) });
};

exports.get = (req, res) => {
  const p = db.prepare('SELECT p.*, c.name category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?').get(req.params.id);
  if (!p) throw new HttpError(404, 'Producto no encontrado');
  res.json(map(p));
};

exports.create = (req, res) => {
  const { name, description = '', price, stock = 0, imageUrl = '', categoryId = null } = req.body;
  const info = db.prepare('INSERT INTO products (name, description, price, stock, image_url, category_id) VALUES (?,?,?,?,?,?)')
    .run(name, description, price, stock, imageUrl, categoryId);
  req.params.id = info.lastInsertRowid;
  res.status(201);
  exports.get(req, res);
};

exports.update = (req, res) => {
  const cur = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!cur) throw new HttpError(404, 'Producto no encontrado');
  const b = req.body;
  db.prepare('UPDATE products SET name=?, description=?, price=?, stock=?, image_url=?, category_id=? WHERE id=?').run(
    b.name ?? cur.name, b.description ?? cur.description, b.price ?? cur.price, b.stock ?? cur.stock,
    b.imageUrl ?? cur.image_url, b.categoryId ?? cur.category_id, cur.id);
  exports.get(req, res);
};

exports.remove = (req, res) => {
  // Baja lógica: no rompe pedidos viejos
  const info = db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  if (!info.changes) throw new HttpError(404, 'Producto no encontrado');
  res.status(204).end();
};

exports.categories = (_req, res) => res.json(db.prepare('SELECT id, name, slug FROM categories ORDER BY name').all());
