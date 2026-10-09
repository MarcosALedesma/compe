import { Router } from 'express';

import authRoutes from './auth.routes.js';
import alumnosRoutes from './alumnos.routes.js';
import docentesRoutes from './docentes.routes.js';
import cursosRoutes from './cursos.routes.js';
import materiasRoutes from './materias.routes.js';
import calificacionesRoutes from './calificaciones.routes.js';
import asistenciasRoutes from './asistencias.routes.js';
import eventosRoutes from './eventos.routes.js';
import panelRoutes from './panel.routes.js';
import portalRoutes from './portal.routes.js';
import boletinRoutes from './boletin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/alumnos', alumnosRoutes);
router.use('/docentes', docentesRoutes);
router.use('/cursos', cursosRoutes);
router.use('/', materiasRoutes);            // ⚠️ ver nota abajo
router.use('/calificaciones', calificacionesRoutes);
router.use('/asistencias', asistenciasRoutes);
router.use('/eventos', eventosRoutes);
router.use('/panel', panelRoutes);
router.use('/portal', portalRoutes);
router.use('/boletin', boletinRoutes);

export default router;