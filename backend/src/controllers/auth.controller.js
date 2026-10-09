const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { jwtSecret, jwtExpires } = require('../config/env');
const HttpError = require('../utils/httpError');

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const sign = (u) => jwt.sign({ id: u.id, role: u.role, email: u.email }, jwtSecret, { expiresIn: jwtExpires });

exports.register = (req, res) => {
  const { name, email, password } = req.body;
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) throw new HttpError(409, 'El email ya está registrado');
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, hash);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: sign(user), user: publicUser(user) });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) throw new HttpError(401, 'Credenciales incorrectas');
  res.json({ token: sign(user), user: publicUser(user) });
};

exports.me = (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
  res.json(publicUser(user));
};
