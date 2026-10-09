const db = require('../config/db');
const HttpError = require('../utils/httpError');
const { buildCart } = require('./cart.controller');

const getOrder = (id) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!o) return null;
  const items = db.prepare('SELECT product_id productId, name_snapshot name, price_snapshot price, quantity FROM order_items WHERE order_id = ?').all(id);
  return { id: o.id, userId: o.user_id, total: o.total, status: o.status, shippingAddress: o.shipping_address, createdAt: o.created_at, items };
};

// Checkout: valida stock, crea orden, descuenta stock y vacía el carrito (transacción)
const checkout = db.transaction((userId, shippingAddress) => {
  const cart = buildCart(userId);
  if (!cart.items.length) throw new HttpError(400, 'El carrito está vacío');
  for (const i of cart.items) {
    if (i.quantity > i.stock) throw new HttpError(400, `Stock insuficiente para "${i.name}"`);
  }
  const info = db.prepare('INSERT INTO orders (user_id, total, shipping_address) VALUES (?,?,?)').run(userId, cart.total, shippingAddress);
  const insItem = db.prepare('INSERT INTO order_items (order_id, product_id, name_snapshot, price_snapshot, quantity) VALUES (?,?,?,?,?)');
  const dec = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  for (const i of cart.items) {
    insItem.run(info.lastInsertRowid, i.productId, i.name, i.price, i.quantity);
    dec.run(i.quantity, i.productId);
  }
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
  return info.lastInsertRowid;
});

exports.create = (req, res) => {
  const id = checkout(req.user.id, req.body.shippingAddress);
  res.status(201).json(getOrder(id));
};

exports.list = (req, res) => {
  const rows = req.user.role === 'admin'
    ? db.prepare('SELECT id FROM orders ORDER BY id DESC').all()
    : db.prepare('SELECT id FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
  res.json(rows.map((r) => getOrder(r.id)));
};

exports.get = (req, res) => {
  const o = getOrder(req.params.id);
  if (!o || (req.user.role !== 'admin' && o.userId !== req.user.id)) throw new HttpError(404, 'Pedido no encontrado');
  res.json(o);
};

exports.updateStatus = (req, res) => {
  const info = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  if (!info.changes) throw new HttpError(404, 'Pedido no encontrado');
  res.json(getOrder(req.params.id));
};
