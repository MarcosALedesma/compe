import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export const login = (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = db
      .query(
        `SELECT id, email, password_hash, rol, alumno_id, docente_id
         FROM usuarios WHERE email = ? AND activo = 1`
      )
      .get(email);

    if (!user) throw new HttpError(401, 'Credenciales inválidas');

    const ok = Bun.password.verifySync(password, user.password_hash);
    if (!ok) throw new HttpError(401, 'Credenciales inválidas');

    const payload = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      alumno_id: user.alumno_id,
      docente_id: user.docente_id
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES });
    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
};

export const me = (req, res) => res.json({ user: req.user });