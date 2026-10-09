import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ctrl from '../controllers/panel.controller.js';

const router = Router();

router.use(auth, requireRole('directivo'));

router.get('/resumen', ctrl.resumen);
router.get('/alumnos-por-anio', ctrl.alumnosPorAnio);
router.get('/promedio-por-curso', ctrl.promedioPorCurso);
router.get('/top-faltas', ctrl.topFaltas);
router.get('/materias-desaprobadas', ctrl.materiasDesaprobadas);
router.get('/alertas-asistencia', ctrl.alertasAsistencia);

export default router;