import { Database } from "bun:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

// ----------------------------------------------------------------
const DB_PATH =
  process.env.DB_PATH ?? join(import.meta.dir, "../../data/app.db");
mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

const RESET = process.argv.includes("--reset");

if (RESET) {
  db.exec("PRAGMA foreign_keys = OFF;");
  for (const v of ["v_inasistencias", "v_promedio_anual"])
    db.exec(`DROP VIEW IF EXISTS ${v};`);
  for (const t of [
    "auditoria_calificaciones",
    "calificaciones",
    "asistencias",
    "eventos",
    "materias_curso",
    "materias",
    "usuarios",
    "alumnos",
    "docentes",
    "cursos",
  ])
    db.exec(`DROP TABLE IF EXISTS ${t};`);
  db.exec("PRAGMA foreign_keys = ON;");
}

db.exec(readFileSync(join(import.meta.dir, "../db/schema.sql"), "utf8"));

const yaCargado = db.query("SELECT COUNT(*) AS n FROM cursos").get().n > 0;
if (yaCargado) {
  console.log("La base ya tiene datos. Usá --reset para recargar.");
  process.exit(0);
}

// -------------------------------------------------------
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(602);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const CICLO = 2026;
const PASSWORD = "Prime2026!";
const passwordHash = Bun.password.hashSync(PASSWORD); // se reutiliza para todos

const NOMBRES = [
  "Lucía",
  "Mateo",
  "Valentina",
  "Santiago",
  "Camila",
  "Benjamín",
  "Sofía",
  "Thiago",
  "Martina",
  "Joaquín",
  "Julieta",
  "Lautaro",
  "Agustina",
  "Bautista",
  "Milagros",
  "Franco",
  "Candela",
  "Nicolás",
  "Abril",
  "Tomás",
];
const APELLIDOS = [
  "González",
  "Rodríguez",
  "Fernández",
  "López",
  "Martínez",
  "Pérez",
  "Gómez",
  "Sánchez",
  "Romero",
  "Díaz",
  "Álvarez",
  "Torres",
  "Ruiz",
  "Ramírez",
  "Acosta",
  "Benítez",
  "Medina",
  "Herrera",
  "Suárez",
  "Aguirre",
  "Giménez",
  "Molina",
  "Silva",
  "Castro",
  "Rojas",
  "Ortiz",
  "Núñez",
  "Luna",
  "Cabrera",
  "Ríos",
];
const MATERIAS_POR_ANIO = {
  1: [
    "Matemática",
    "Lengua y Literatura",
    "Inglés",
    "Ciencias Naturales",
    "Tecnología",
  ],
  2: [
    "Matemática",
    "Lengua y Literatura",
    "Inglés",
    "Geografía",
    "Taller de Informática",
  ],
  3: [
    "Matemática",
    "Lengua y Literatura",
    "Inglés",
    "Física",
    "Programación I",
  ],
  4: [
    "Matemática",
    "Lengua y Literatura",
    "Inglés",
    "Química",
    "Programación II",
  ],
  5: [
    "Matemática",
    "Lengua y Literatura",
    "Inglés",
    "Bases de Datos",
    "Sistemas Operativos",
  ],
  6: ["Matemática", "Lengua y Literatura", "Inglés", "Redes", "Proyecto Final"],
};

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ------------------------------------------------------------------- Carga
const tx = db.transaction(() => {
  const insCurso = db.prepare(
    "INSERT INTO cursos (anio, division, turno, ciclo_lectivo) VALUES (?, 'A', 'mañana', ?)",
  );
  const cursoIds = [];
  for (let anio = 1; anio <= 6; anio++)
    cursoIds.push(Number(insCurso.run(anio, CICLO).lastInsertRowid));

  const insDocente = db.prepare(
    "INSERT INTO docentes (dni, apellido, nombre, email, telefono) VALUES (?, ?, ?, ?, ?)",
  );
  const docenteIds = [];
  for (let i = 0; i < 8; i++) {
    const ape = APELLIDOS[(i * 3 + 5) % APELLIDOS.length];
    const nom = NOMBRES[(i * 5 + 2) % NOMBRES.length];
    const id = insDocente.run(
      String(20100000 + i * 137),
      ape,
      nom,
      i === 0 ? "docente@eetp602.test" : `docente${i + 1}@eetp602.test`,
      `3462-4${String(10000 + i * 211).slice(0, 5)}`,
    ).lastInsertRowid;
    docenteIds.push(Number(id));
  }

  const insMateria = db.prepare(
    "INSERT INTO materias (nombre, anio) VALUES (?, ?)",
  );
  const insMC = db.prepare(
    "INSERT INTO materias_curso (curso_id, materia_id, docente_id) VALUES (?, ?, ?)",
  );
  const materiasCursoPorCurso = {}; // cursoId -> [mcId, ...]
  let rot = 0;
  cursoIds.forEach((cursoId, idx) => {
    const anio = idx + 1;
    materiasCursoPorCurso[cursoId] = [];
    for (const nombre of MATERIAS_POR_ANIO[anio]) {
      const materiaId = Number(insMateria.run(nombre, anio).lastInsertRowid);
      const docId = docenteIds[rot++ % docenteIds.length];
      const mcId = Number(insMC.run(cursoId, materiaId, docId).lastInsertRowid);
      materiasCursoPorCurso[cursoId].push(mcId);
    }
  });

  const insAlumno = db.prepare(
    `INSERT INTO alumnos (dni, apellido, nombre, fecha_nac, tutor, telefono_tutor, curso_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const alumnosPorCurso = {}; // cursoId -> [alumnoId, ...]
  const todosAlumnos = [];
  let n = 0;
  cursoIds.forEach((cursoId, idx) => {
    alumnosPorCurso[cursoId] = [];
    const anio = idx + 1;
    for (let k = 0; k < 10; k++, n++) {
      const ape = APELLIDOS[n % APELLIDOS.length];
      const nom = NOMBRES[(n * 7 + 3) % NOMBRES.length];
      const nacimiento = `${CICLO - (12 + anio)}-${pad(1 + (n % 12))}-${pad(1 + ((n * 3) % 28))}`;
      const id = Number(
        insAlumno.run(
          String(45000000 - n * 1013),
          ape,
          nom,
          nacimiento,
          `${pick(NOMBRES)} ${ape}`,
          `3462-5${String(10000 + n * 97).slice(0, 5)}`,
          cursoId,
        ).lastInsertRowid,
      );
      alumnosPorCurso[cursoId].push(id);
      todosAlumnos.push(id);
    }
  });

  const insUsuario = db.prepare(
    "INSERT INTO usuarios (email, password_hash, rol, docente_id, alumno_id) VALUES (?, ?, ?, ?, ?)",
  );
  insUsuario.run(
    "director@eetp602.test",
    passwordHash,
    "directivo",
    null,
    null,
  );
  insUsuario.run(
    "docente@eetp602.test",
    passwordHash,
    "docente",
    docenteIds[0],
    null,
  );
  insUsuario.run(
    "alumno@eetp602.test",
    passwordHash,
    "alumno",
    null,
    todosAlumnos[0],
  );

  const insNota = db.prepare(
    "INSERT INTO calificaciones (alumno_id, materia_curso_id, trimestre, nota) VALUES (?, ?, ?, ?)",
  );
  for (const cursoId of cursoIds.slice(0, 2)) {
    for (const alumnoId of alumnosPorCurso[cursoId]) {
      const nivel = 4 + rnd() * 5; // cada alumno tiene un "nivel" base entre 4 y 9
      for (const mcId of materiasCursoPorCurso[cursoId]) {
        for (let tri = 1; tri <= 3; tri++) {
          const nota = Math.min(
            10,
            Math.max(1, Math.round(nivel + (rnd() - 0.5) * 4)),
          );
          insNota.run(alumnoId, mcId, tri, nota);
        }
      }
    }
  }

  const insAsis = db.prepare(
    "INSERT INTO asistencias (alumno_id, fecha, estado) VALUES (?, ?, ?)",
  );
  const dias = [];
  const d = new Date(2026, 8, 14); // lunes 14/09/2026
  while (dias.length < 10) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) dias.push(iso(d));
    d.setDate(d.getDate() + 1);
  }
  for (const alumnoId of alumnosPorCurso[cursoIds[0]]) {
    for (const fecha of dias) {
      const r = rnd();
      insAsis.run(alumnoId, fecha, r < 0.82 ? "P" : r < 0.92 ? "A" : "T");
    }
  }

  const insEvento = db.prepare(
    "INSERT INTO eventos (titulo, tipo, fecha_inicio, fecha_fin, curso_id) VALUES (?, ?, ?, ?, NULL)",
  );
  insEvento.run("Acto Día de la Bandera", "acto", "2026-06-19", "2026-06-19");
  insEvento.run(
    "Cierre del 2º trimestre",
    "institucional",
    "2026-09-04",
    "2026-09-04",
  );
  insEvento.run(
    "Encuentro Tecnológico",
    "institucional",
    "2026-10-09",
    "2026-10-09",
  );
  insEvento.run(
    "Feriado - Inmaculada Concepción",
    "feriado",
    "2026-12-08",
    "2026-12-08",
  );
  insEvento.run(
    "Mesa de examen de diciembre",
    "examen",
    "2026-12-14",
    "2026-12-18",
  );
});

tx();

// ------------------------------------------------------------------
const count = (t) => db.query(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
console.log("Seed completado:");
for (const t of [
  "cursos",
  "alumnos",
  "docentes",
  "materias",
  "materias_curso",
  "usuarios",
  "calificaciones",
  "asistencias",
  "eventos",
]) {
  console.log(`  ${t.padEnd(16)} ${count(t)}`);
}
console.log(`\nUsuarios de prueba (clave ${PASSWORD}):`);
console.log("  director@eetp602.test  (directivo)");
console.log("  docente@eetp602.test   (docente)");
console.log("  alumno@eetp602.test    (alumno)");
