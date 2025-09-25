import { Router } from 'express';
import rolesRoutes from './roles.routes.js';
import authRoutes from './auth.routes.js'

const router = Router();

router.use('/roles', rolesRoutes);
console.log('[routes] mounted /roles');
router.use('/auth', authRoutes);
console.log('[routes] mounted /auth');

export default router;
