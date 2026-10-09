import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ctrl from '../controllers/materias.controller.js';

const router = Router();

router.get('/materias', auth, ctrl.listarMaterias);
router.post('/materias', auth, requireRole('directivo'), ctrl.crearMateria);
router.get('/cursos/:cursoId/materias', auth, ctrl.listarMateriasDeCurso);
router.post('/materias-curso', auth, requireRole('directivo'), ctrl.asignarMateriaACurso);
router.put('/materias-curso/:id', auth, requireRole('directivo'), ctrl.actualizarAsignacion);
router.delete('/materias-curso/:id', auth, requireRole('directivo'), ctrl.eliminarAsignacion);

export default router;