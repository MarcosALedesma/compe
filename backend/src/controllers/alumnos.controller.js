import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

export const listar = (req, res, next) => {
  try {
    const { search = '', curso_id, activo = 1 } = req.query;
    const like = `%${search}%`;

    let sql = `
      SELECT a.id, a.dni, a.apellido, a.nombre, a.fecha_nac,
             a.tutor, a.telefono_tutor, a.activo,
             c.id AS curso_id, c.anio, c.division, c.turno
      FROM alumnos a
      LEFT JOIN cursos c ON c.id = a.curso_id
      WHERE a.activo = ?
        AND (a.dni LIKE ? OR a.apellido LIKE ? OR a.nombre LIKE ?)
    `;
    const params = [Number(activo), like, like, like];

    if (curso_id) {
      sql += ' AND a.curso_id = ?';
      params.push(Number(curso_id));
    }
    sql += ' ORDER BY a.apellido, a.nombre';

    res.json(db.query(sql).all(...params));
  } catch (err) {
    next(err);
  }
};

export const obtener = (req, res, next) => {
  try {
    const alumno = db.query('SELECT * FROM alumnos WHERE id = ?').get(req.params.id);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado');
    res.json(alumno);
  } catch (err) {
    next(err);
  }
};

export const crear = (req, res, next) => {
  try {
    const { dni, apellido, nombre, fecha_nac, tutor, telefono_tutor, curso_id } = req.body;

    const dup = db.query('SELECT id FROM alumnos WHERE dni = ?').get(dni);
    if (dup) throw new HttpError(409, 'Ya existe un alumno con ese DNI');

    const result = db
      .query(
        `INSERT INTO alumnos (dni, apellido, nombre, fecha_nac, tutor, telefono_tutor, curso_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(dni, apellido, nombre, fecha_nac, tutor ?? null, telefono_tutor ?? null, curso_id ?? null);

    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) {
    next(err);
  }
};

export const actualizar = (req, res, next) => {
  try {
    const { id } = req.params;
    const alumno = db.query('SELECT * FROM alumnos WHERE id = ?').get(id);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado');

    const { dni, apellido, nombre, fecha_nac, tutor, telefono_tutor, curso_id } = req.body;

    if (dni && dni !== alumno.dni) {
      const dup = db.query('SELECT id FROM alumnos WHERE dni = ? AND id <> ?').get(dni, id);
      if (dup) throw new HttpError(409, 'DNI ya usado por otro alumno');
    }

    db.query(
      `UPDATE alumnos SET
        dni = COALESCE(?, dni),
        apellido = COALESCE(?, apellido),
        nombre = COALESCE(?, nombre),
        fecha_nac = COALESCE(?, fecha_nac),
        tutor = COALESCE(?, tutor),
        telefono_tutor = COALESCE(?, telefono_tutor),
        curso_id = ?
      WHERE id = ?`
    ).run(
      dni ?? null, apellido ?? null, nombre ?? null, fecha_nac ?? null,
      tutor ?? null, telefono_tutor ?? null,
      curso_id !== undefined ? curso_id : alumno.curso_id,
      id
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Baja lógica
export const bajaLogica = (req, res, next) => {
  try {
    const result = db.query('UPDATE alumnos SET activo = 0 WHERE id = ?').run(req.params.id);
    if (!result.changes) throw new HttpError(404, 'Alumno no encontrado');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const asignarCurso = (req, res, next) => {
  try {
    const { id } = req.params;
    const { curso_id } = req.body;

    if (!curso_id) throw new HttpError(400, 'curso_id es obligatorio');

    const alumno = db.query('SELECT * FROM alumnos WHERE id = ?').get(id);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado');

    const curso = db.query('SELECT id FROM cursos WHERE id = ?').get(curso_id);
    if (!curso) throw new HttpError(404, 'Curso no encontrado');

    if (alumno.curso_id === Number(curso_id)) {
      throw new HttpError(409, 'El alumno ya está en ese curso');
    }

    db.query('UPDATE alumnos SET curso_id = ? WHERE id = ?').run(curso_id, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// =====================================================
// IMPORTAR ALUMNOS DESDE CSV 
// =====================================================

export async function importarCSV(req, res) {
  try {
    const { csv } = req.body;

    if (!csv || typeof csv !== 'string' || csv.trim() === '') {
      return res.status(400).json({ error: 'CSV vacío o inválido' });
    }

    const lineas = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lineas.length === 0) {
      return res.status(400).json({ error: 'CSV sin filas' });
    }

    const primera = lineas[0].toLowerCase();
    const tieneCabecera =
      primera.includes('dni') || primera.includes('apellido');
    const filas = tieneCabecera ? lineas.slice(1) : lineas;

    if (filas.length === 0) {
      return res.status(400).json({ error: 'CSV sin datos (solo cabecera)' });
    }

    const insertados = [];
    const rechazados = [];

    const insertStmt = db.prepare(`
      INSERT INTO alumnos
        (dni, apellido, nombre, fecha_nac, tutor, telefono_tutor, curso_id, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (let i = 0; i < filas.length; i++) {
      const numLinea = i + (tieneCabecera ? 2 : 1);
      const columnas = filas[i].split(',').map((c) => c.trim());

      if (columnas.length < 3) {
        rechazados.push({
          linea: numLinea,
          motivo: 'Faltan columnas (mínimo: dni, apellido, nombre)',
          datos: filas[i],
        });
        continue;
      }

      const [dni, apellido, nombre, fecha_nac, tutor, telefono_tutor, cursoRaw] =
        columnas;

      const errores = [];

      if (!/^\d{7,8}$/.test(dni)) {
        errores.push('DNI inválido (debe tener 7 u 8 dígitos)');
      }
      if (!apellido || apellido.length < 2) {
        errores.push('Apellido inválido');
      }
      if (!nombre || nombre.length < 2) {
        errores.push('Nombre inválido');
      }
      if (fecha_nac && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_nac)) {
        errores.push('fecha_nac inválida (formato YYYY-MM-DD)');
      }

      const existe = db
        .prepare('SELECT id FROM alumnos WHERE dni = ?')
        .get(dni);
      if (existe) {
        errores.push(`DNI ${dni} ya existe (id=${existe.id})`);
      }

      let curso_id = null;
      if (cursoRaw) {
        const match = cursoRaw.match(/^(\d)\s*[º°]?\s*([A-Za-z]?)$/);
        if (match) {
          const anio = parseInt(match[1], 10);
          const division = match[2] ? match[2].toUpperCase() : 'A';
          const curso = db
            .prepare(
              'SELECT id FROM cursos WHERE anio = ? AND division = ? LIMIT 1'
            )
            .get(anio, division);
          if (curso) {
            curso_id = curso.id;
          } else {
            errores.push(`Curso "${cursoRaw}" no encontrado`);
          }
        } else {
          errores.push(`Formato de curso inválido: "${cursoRaw}"`);
        }
      }

      if (errores.length > 0) {
        rechazados.push({ linea: numLinea, motivo: errores.join(' | '), datos: filas[i] });
        continue;
      }

      try {
        const info = insertStmt.run(
          dni,
          apellido,
          nombre,
          fecha_nac || null,
          tutor || null,
          telefono_tutor || null,
          curso_id
        );
        insertados.push({
          linea: numLinea,
          id: info.lastInsertRowid,
          dni,
          apellido,
          nombre,
        });
      } catch (e) {
        rechazados.push({
          linea: numLinea,
          motivo: `Error al insertar: ${e.message}`,
          datos: filas[i],
        });
      }
    }

    return res.json({
      ok: true,
      total: filas.length,
      insertados: insertados.length,
      rechazados: rechazados.length,
      detalleInsertados: insertados,
      detalleRechazados: rechazados,
    });
  } catch (err) {
    console.error('importarCSV:', err);
    return res.status(500).json({ error: 'Error interno al importar CSV' });
  }
}