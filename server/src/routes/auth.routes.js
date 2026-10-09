import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import * as authCtrl from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', authCtrl.login);
router.get('/me', auth, authCtrl.me);

export default router;