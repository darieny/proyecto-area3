import { Router } from 'express';
import rolesRoutes from './roles.routes.js';
import authRoutes from './auth.routes.js'

const router = Router();

router.use('/roles', rolesRoutes);
router.use('/auth', authRoutes);

export default router;
