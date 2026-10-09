
export function validarNota(nota) {
  const n = Number(nota);

  if (nota === undefined || nota === null || nota === '') {
    return { ok: false, error: 'La nota es obligatoria' };
  }
  if (Number.isNaN(n)) {
    return { ok: false, error: 'La nota debe ser un número' };
  }
  if (!Number.isInteger(n)) {
    return { ok: false, error: 'La nota debe ser un número entero' };
  }
  if (n < 1 || n > 10) {
    return { ok: false, error: 'La nota debe estar entre 1 y 10' };
  }
  return { ok: true };
}


export function validarTrimestre(trimestre) {
  const t = Number(trimestre);

  if (trimestre === undefined || trimestre === null || trimestre === '') {
    return { ok: false, error: 'El trimestre es obligatorio' };
  }
  if (Number.isNaN(t)) {
    return { ok: false, error: 'El trimestre debe ser un número' };
  }
  if (![1, 2, 3].includes(t)) {
    return { ok: false, error: 'El trimestre debe ser 1, 2 o 3' };
  }
  return { ok: true };
}


export function calcularPromedio(notas) {
  const validas = (notas || [])
    .map((n) => Number(n))
    .filter((n) => !Number.isNaN(n));

  if (validas.length === 0) return null;

  const suma = validas.reduce((acc, n) => acc + n, 0);
  const prom = suma / validas.length;

  return Math.round(prom * 100) / 100;
}

export function calcularEstado(promedio, notasTrimestrales = []) {
  if (promedio === null || promedio === undefined) return null;

  if (promedio >= 7) return 'Aprobado';

  const desaprobadas = notasTrimestrales.filter(
    (n) => typeof n === 'number' && n < 4
  ).length;

  if (promedio < 4 && desaprobadas >= 2) return 'Previa';

  if (promedio < 4) return 'Febrero';

  return 'Diciembre';
}

export function agruparPorMateria(rows) {
  const mapa = new Map();

  for (const r of rows) {
    const key = r.materia_curso_id;
    if (!mapa.has(key)) {
      mapa.set(key, {
        materia_curso_id: key,
        materia: r.materia ?? r.materia_nombre ?? 'Materia',
        notas: { 1: null, 2: null, 3: null },
      });
    }
    const item = mapa.get(key);
    if (r.trimestre >= 1 && r.trimestre <= 3) {
      item.notas[r.trimestre] = r.nota;
    }
  }

  const resultado = [];
  for (const item of mapa.values()) {
    const notasArr = [item.notas[1], item.notas[2], item.notas[3]];
    const promedio = calcularPromedio(notasArr);
    const estado = calcularEstado(promedio, notasArr.filter((n) => n !== null));
    resultado.push({ ...item, promedio, estado });
  }

  resultado.sort((a, b) => a.materia.localeCompare(b.materia));
  return resultado;
}

export function calcularPromedioGeneral(materias) {
  const promedios = (materias || [])
    .map((m) => m.promedio)
    .filter((p) => typeof p === 'number' && !Number.isNaN(p));

  if (promedios.length === 0) return null;

  const suma = promedios.reduce((acc, p) => acc + p, 0);
  const prom = suma / promedios.length;

  return Math.round(prom * 100) / 100;
}


export function contarDesaprobadas(materias) {
  return (materias || []).filter(
    (m) => m.estado && m.estado !== 'Aprobado'
  ).length;
}


export function buscarNotaExistente(db, alumno_id, materia_curso_id, trimestre) {
  return db
    .prepare(
      `SELECT id, nota FROM calificaciones
       WHERE alumno_id = ? AND materia_curso_id = ? AND trimestre = ?`
    )
    .get(alumno_id, materia_curso_id, trimestre);
}