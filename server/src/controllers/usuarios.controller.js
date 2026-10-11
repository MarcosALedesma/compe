import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

function validarPassword(password) {
  if (typeof password !== 'string' || password.length < 10) {
    throw new HttpError(400, 'La contraseña debe tener al menos 10 caracteres');
  }
}

export const listar = (req, res, next) => {
  try {
    const usuarios = db.query(`
      SELECT u.id, u.email, u.rol, u.activo, u.docente_id, u.alumno_id,
             d.apellido AS docente_apellido, d.nombre AS docente_nombre,
             a.apellido AS alumno_apellido, a.nombre AS alumno_nombre
      FROM usuarios u
      LEFT JOIN docentes d ON d.id = u.docente_id
      LEFT JOIN alumnos a ON a.id = u.alumno_id
      ORDER BY u.rol, u.email
    `).all();
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
};

export const disponibles = (req, res, next) => {
  try {
    const { rol } = req.query;
    if (rol === 'docente') {
      return res.json(db.query(`
        SELECT d.id, d.dni, d.apellido, d.nombre, d.email
        FROM docentes d
        LEFT JOIN usuarios u ON u.docente_id = d.id
        WHERE d.activo = 1 AND u.id IS NULL
        ORDER BY d.apellido, d.nombre
      `).all());
    }
    if (rol === 'alumno') {
      return res.json(db.query(`
        SELECT a.id, a.dni, a.apellido, a.nombre
        FROM alumnos a
        LEFT JOIN usuarios u ON u.alumno_id = a.id
        WHERE a.activo = 1 AND u.id IS NULL
        ORDER BY a.apellido, a.nombre
      `).all());
    }
    throw new HttpError(400, 'rol debe ser docente o alumno');
  } catch (err) {
    next(err);
  }
};

export const crear = (req, res, next) => {
  try {
    const { rol, entidad_id, email, password } = req.body;
    if (!['docente', 'alumno'].includes(rol)) {
      throw new HttpError(400, 'Solo se pueden crear cuentas de docente o alumno');
    }
    if (!Number.isInteger(Number(entidad_id)) || Number(entidad_id) <= 0) {
      throw new HttpError(400, 'Seleccioná una persona válida');
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new HttpError(400, 'Email inválido');
    }
    validarPassword(password);

    const entidad = rol === 'docente'
      ? db.query('SELECT id FROM docentes WHERE id = ? AND activo = 1').get(Number(entidad_id))
      : db.query('SELECT id FROM alumnos WHERE id = ? AND activo = 1').get(Number(entidad_id));
    if (!entidad) throw new HttpError(404, 'Persona no encontrada o inactiva');

    const emailNormalizado = email.trim().toLowerCase();
    const duplicado = db.query('SELECT id FROM usuarios WHERE email = ?').get(emailNormalizado);
    if (duplicado) throw new HttpError(409, 'Ya existe una cuenta con ese email');

    const vinculada = rol === 'docente'
      ? db.query('SELECT id FROM usuarios WHERE docente_id = ?').get(Number(entidad_id))
      : db.query('SELECT id FROM usuarios WHERE alumno_id = ?').get(Number(entidad_id));
    if (vinculada) throw new HttpError(409, 'La persona ya tiene una cuenta');

    const passwordHash = Bun.password.hashSync(password);
    const result = rol === 'docente'
      ? db.query(`INSERT INTO usuarios (email, password_hash, rol, docente_id) VALUES (?, ?, ?, ?)`).run(
          emailNormalizado, passwordHash, rol, Number(entidad_id)
        )
      : db.query(`INSERT INTO usuarios (email, password_hash, rol, alumno_id) VALUES (?, ?, ?, ?)`).run(
          emailNormalizado, passwordHash, rol, Number(entidad_id)
        );
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) {
    next(err);
  }
};

export const cambiarEstado = (req, res, next) => {
  try {
    const { activo } = req.body;
    if (typeof activo !== 'boolean') throw new HttpError(400, 'activo debe ser booleano');
    const usuario = db.query('SELECT id, rol FROM usuarios WHERE id = ?').get(req.params.id);
    if (!usuario) throw new HttpError(404, 'Cuenta no encontrada');
    if (usuario.rol === 'directivo') throw new HttpError(403, 'No se puede modificar una cuenta directiva desde este panel');

    db.query('UPDATE usuarios SET activo = ? WHERE id = ?').run(activo ? 1 : 0, usuario.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const cambiarPassword = (req, res, next) => {
  try {
    const { password } = req.body;
    validarPassword(password);
    const usuario = db.query('SELECT id, rol FROM usuarios WHERE id = ?').get(req.params.id);
    if (!usuario) throw new HttpError(404, 'Cuenta no encontrada');
    if (usuario.rol === 'directivo') throw new HttpError(403, 'No se puede modificar una cuenta directiva desde este panel');

    const passwordHash = Bun.password.hashSync(password);
    db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(passwordHash, usuario.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
