import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';


export const listar = (req, res, next) => {
  try {
    const { desde, hasta, tipo, curso_id } = req.query;

    let sql = `
      SELECT e.id, e.titulo, e.tipo, e.fecha_inicio, e.fecha_fin, e.curso_id,
             c.anio, c.division
      FROM eventos e
      LEFT JOIN cursos c ON c.id = e.curso_id
      WHERE 1=1
    `;
    const params = [];

    if (desde)    { sql += ' AND e.fecha_fin >= ?';    params.push(desde); }
    if (hasta)    { sql += ' AND e.fecha_inicio <= ?'; params.push(hasta); }
    if (tipo)     { sql += ' AND e.tipo = ?';          params.push(tipo); }
    if (curso_id) { sql += ' AND (e.curso_id = ? OR e.curso_id IS NULL)'; params.push(curso_id); }

    sql += ' ORDER BY e.fecha_inicio';

    res.json(db.query(sql).all(...params));
  } catch (err) { next(err); }
};


export const porMes = (req, res, next) => {
  try {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);

    if (!anio || !mes || mes < 1 || mes > 12) {
      throw new HttpError(400, 'anio y mes son obligatorios (mes 1-12)');
    }

    const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const fin = new Date(anio, mes, 0); // último día del mes
    const finStr = `${anio}-${String(mes).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`;

    const eventos = db
      .query(
        `SELECT e.id, e.titulo, e.tipo, e.fecha_inicio, e.fecha_fin, e.curso_id,
                c.anio, c.division
         FROM eventos e
         LEFT JOIN cursos c ON c.id = e.curso_id
         WHERE e.fecha_inicio <= ? AND e.fecha_fin >= ?
         ORDER BY e.fecha_inicio`
      )
      .all(finStr, inicio);

    res.json({ anio, mes, eventos });
  } catch (err) { next(err); }
};


export const proximos = (req, res, next) => {
  try {
    const limite = Math.min(Number(req.query.limite) || 5, 50);
    const hoy = new Date().toISOString().slice(0, 10);

    const eventos = db
      .query(
        `SELECT e.id, e.titulo, e.tipo, e.fecha_inicio, e.fecha_fin, e.curso_id
         FROM eventos e
         WHERE e.fecha_fin >= ?
         ORDER BY e.fecha_inicio
         LIMIT ?`
      )
      .all(hoy, limite);

    res.json(eventos);
  } catch (err) { next(err); }
};


export const obtener = (req, res, next) => {
  try {
    const ev = db.query('SELECT * FROM eventos WHERE id = ?').get(req.params.id);
    if (!ev) throw new HttpError(404, 'Evento no encontrado');
    res.json(ev);
  } catch (err) { next(err); }
};


export const crear = (req, res, next) => {
  try {
    const { titulo, tipo, fecha_inicio, fecha_fin, curso_id } = req.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_fin)) {
      throw new HttpError(400, 'Las fechas deben tener formato YYYY-MM-DD');
    }
    if (fecha_fin < fecha_inicio) {
      throw new HttpError(400, 'fecha_fin no puede ser anterior a fecha_inicio');
    }

    const r = db
      .query(
        `INSERT INTO eventos (titulo, tipo, fecha_inicio, fecha_fin, curso_id)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(titulo, tipo, fecha_inicio, fecha_fin, curso_id ?? null);

    res.status(201).json({ id: Number(r.lastInsertRowid) });
  } catch (err) { next(err); }
};

export const actualizar = (req, res, next) => {
  try {
    const { id } = req.params;
    const ev = db.query('SELECT * FROM eventos WHERE id = ?').get(id);
    if (!ev) throw new HttpError(404, 'Evento no encontrado');

    const { titulo, tipo, fecha_inicio, fecha_fin, curso_id } = req.body;

    if (fecha_inicio && fecha_fin && fecha_fin < fecha_inicio) {
      throw new HttpError(400, 'fecha_fin no puede ser anterior a fecha_inicio');
    }

    db.query(
      `UPDATE eventos SET
        titulo = COALESCE(?, titulo),
        tipo = COALESCE(?, tipo),
        fecha_inicio = COALESCE(?, fecha_inicio),
        fecha_fin = COALESCE(?, fecha_fin),
        curso_id = ?
       WHERE id = ?`
    ).run(
      titulo ?? null, tipo ?? null, fecha_inicio ?? null, fecha_fin ?? null,
      curso_id !== undefined ? curso_id : ev.curso_id,
      id
    );

    res.json({ ok: true });
  } catch (err) { next(err); }
};


export const eliminar = (req, res, next) => {
  try {
    const r = db.query('DELETE FROM eventos WHERE id = ?').run(req.params.id);
    if (!r.changes) throw new HttpError(404, 'Evento no encontrado');
    res.json({ ok: true });
  } catch (err) { next(err); }
};