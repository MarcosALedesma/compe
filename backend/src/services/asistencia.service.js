
export const ESTADOS_VALIDOS = ['P', 'A', 'T'];
export const LIMITE_ALERTA_FALTAS = 20;


export function validarEstado(estado) {
  if (!estado || typeof estado !== 'string') {
    return { ok: false, error: 'El estado es obligatorio' };
  }
  const e = estado.toUpperCase().trim();
  if (!ESTADOS_VALIDOS.includes(e)) {
    return {
      ok: false,
      error: `Estado inválido. Debe ser P (Presente), A (Ausente) o T (Tarde)`,
    };
  }
  return { ok: true, estado: e };
}


export function validarFecha(fecha) {
  if (!fecha || typeof fecha !== 'string') {
    return { ok: false, error: 'La fecha es obligatoria' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { ok: false, error: 'La fecha debe tener formato YYYY-MM-DD' };
  }
  const d = new Date(fecha + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: 'La fecha no es válida' };
  }
  const [y, m, day] = fecha.split('-').map(Number);
  if (
    d.getUTCFullYear() !== y ||
    d.getUTCMonth() + 1 !== m ||
    d.getUTCDate() !== day
  ) {
    return { ok: false, error: 'La fecha no existe en el calendario' };
  }
  return { ok: true };
}


export function valorFalta(estado) {
  switch ((estado || '').toUpperCase()) {
    case 'P':
      return 0;
    case 'T':
      return 0.5;
    case 'A':
      return 1;
    default:
      return 0;
  }
}

export function contarFaltas(asistencias) {
  return (asistencias || []).reduce(
    (acc, a) => acc + valorFalta(a.estado),
    0
  );
}

export function enAlerta(faltas) {
  return Number(faltas) >= LIMITE_ALERTA_FALTAS;
}


export function agruparPorAlumno(rows) {
  const mapa = new Map();

  for (const r of rows) {
    const key = r.alumno_id;
    if (!mapa.has(key)) {
      mapa.set(key, {
        alumno_id: key,
        apellido: r.apellido ?? '',
        nombre: r.nombre ?? '',
        presentes: 0,
        ausentes: 0,
        tardes: 0,
        faltas: 0,
      });
    }
    const item = mapa.get(key);
    const estado = (r.estado || '').toUpperCase();
    if (estado === 'P') item.presentes++;
    else if (estado === 'A') item.ausentes++;
    else if (estado === 'T') item.tardes++;

    item.faltas += valorFalta(estado);
  }

  const resultado = [];
  for (const item of mapa.values()) {
    item.alerta = enAlerta(item.faltas);
    resultado.push(item);
  }

  resultado.sort((a, b) => a.apellido.localeCompare(b.apellido));
  return resultado;
}


export function resumenCurso(rows) {
  const porAlumno = agruparPorAlumno(rows);

  let presentes = 0;
  let ausentes = 0;
  let tardes = 0;
  let enAlertaCount = 0;

  for (const a of porAlumno) {
    presentes += a.presentes;
    ausentes += a.ausentes;
    tardes += a.tardes;
    if (a.alerta) enAlertaCount++;
  }

  return {
    total_alumnos: porAlumno.length,
    presentes,
    ausentes,
    tardes,
    alumnos_en_alerta: enAlertaCount,
    alumnos: porAlumno,
  };
}

export function validarToma(registros) {
  if (!Array.isArray(registros) || registros.length === 0) {
    return { ok: false, error: 'Debe enviar al menos un registro' };
  }

  const limpios = [];
  for (let i = 0; i < registros.length; i++) {
    const r = registros[i];
    if (!r || r.alumno_id === undefined) {
      return { ok: false, error: `Registro ${i + 1}: falta alumno_id` };
    }
    const v = validarEstado(r.estado);
    if (!v.ok) {
      return { ok: false, error: `Registro ${i + 1}: ${v.error}` };
    }
    limpios.push({ alumno_id: r.alumno_id, estado: v.estado });
  }

  return { ok: true, limpios };
}