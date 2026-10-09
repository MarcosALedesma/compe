const bcrypt = require('bcryptjs');
const db = require('../config/db');

db.exec('DELETE FROM order_items; DELETE FROM orders; DELETE FROM cart_items; DELETE FROM products; DELETE FROM categories; DELETE FROM users; DELETE FROM sqlite_sequence;');

const insUser = db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)');
insUser.run('Admin', 'admin@test.com', bcrypt.hashSync('admin123', 10), 'admin');
insUser.run('Usuario', 'user@test.com', bcrypt.hashSync('user123', 10), 'user');

const cats = [['Tecnología', 'tecnologia'], ['Hogar', 'hogar'], ['Ropa', 'ropa'], ['Deportes', 'deportes']];
const insCat = db.prepare('INSERT INTO categories (name, slug) VALUES (?,?)');
cats.forEach((c) => insCat.run(...c));

const prods = [
  ['Auriculares Bluetooth', 'Inalámbricos con cancelación de ruido', 45999, 25, 1],
  ['Teclado mecánico', 'Switches rojos, retroiluminado', 38500, 15, 1],
  ['Mouse gamer', '6 botones, 12000 DPI', 21900, 40, 1],
  ['Monitor 24"', 'Full HD, 75Hz', 189000, 8, 1],
  ['Lámpara de escritorio', 'LED regulable', 12500, 30, 2],
  ['Set de sartenes', 'Antiadherentes, 3 piezas', 34900, 12, 2],
  ['Almohada ergonómica', 'Memory foam', 15900, 20, 2],
  ['Remera básica', '100% algodón', 9800, 60, 3],
  ['Campera impermeable', 'Ideal para lluvia', 52000, 10, 3],
  ['Zapatillas running', 'Livianas y con amortiguación', 68000, 18, 4],
  ['Pelota de fútbol', 'Tamaño oficial N°5', 14500, 35, 4],
  ['Mancuernas 5kg (par)', 'Recubiertas de goma', 19800, 22, 4],
];
const insProd = db.prepare('INSERT INTO products (name,description,price,stock,image_url,category_id) VALUES (?,?,?,?,?,?)');
prods.forEach((p, i) => insProd.run(p[0], p[1], p[2], p[3], `https://picsum.photos/seed/prod${i + 1}/400/300`, p[4]));

console.log('Seed OK → admin@test.com / admin123  |  user@test.com / user123');
