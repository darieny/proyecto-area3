// backend/src/routes/dashboard.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { adminSummary, latestVisits } from '../controllers/dashboard.controller.js';

const r = Router();

// Solo usuarios autenticados con rol admin
r.use(requireAuth, requireRole(['admin']));

r.get('/dashboard/admin/summary', adminSummary);
r.get('/dashboard/admin/ultimas-visitas', latestVisits);

export default r;
