const db = require('../config/db');
const HttpError = require('../utils/httpError');

function buildCart(userId) {
  const rows = db.prepare(`
    SELECT ci.id, ci.quantity, p.id product_id, p.name, p.price, p.image_url, p.stock
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ? ORDER BY ci.id`).all(userId);
  const items = rows.map((r) => ({
    id: r.id, productId: r.product_id, name: r.name, price: r.price, imageUrl: r.image_url,
    stock: r.stock, quantity: r.quantity, subtotal: +(r.price * r.quantity).toFixed(2),
  }));
  const total = +items.reduce((s, i) => s + i.subtotal, 0).toFixed(2);
  return { items, total, count: items.reduce((s, i) => s + i.quantity, 0) };
}
exports.buildCart = buildCart;

exports.get = (req, res) => res.json(buildCart(req.user.id));

exports.addItem = (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const p = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(productId);
  if (!p) throw new HttpError(404, 'Producto no encontrado');
  const cur = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);
  const newQty = (cur?.quantity || 0) + quantity;
  if (newQty > p.stock) throw new HttpError(400, `Stock insuficiente (disponible: ${p.stock})`);
  if (cur) db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, cur.id);
  else db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?,?,?)').run(req.user.id, productId, quantity);
  res.status(201).json(buildCart(req.user.id));
};

exports.updateItem = (req, res) => {
  const item = db.prepare('SELECT ci.*, p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.id = ? AND ci.user_id = ?').get(req.params.id, req.user.id);
  if (!item) throw new HttpError(404, 'Item no encontrado');
  const { quantity } = req.body;
  if (quantity > item.stock) throw new HttpError(400, `Stock insuficiente (disponible: ${item.stock})`);
  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, item.id);
  res.json(buildCart(req.user.id));
};

exports.removeItem = (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json(buildCart(req.user.id));
};

exports.clear = (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json(buildCart(req.user.id));
};
