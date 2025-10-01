// backend/src/routes/dashboard.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { adminSummary, latestVisits } from '../controllers/dashboard.controller.js';

const r = Router();

r.get('/ping', (_req, res) => res.json({ ok: true, route: '/dashboard/ping' }));

// Solo usuarios autenticados con rol admin
r.use(requireAuth, requireRole(['admin']));

r.get('/dashboard/admin/summary', adminSummary);
r.get('/dashboard/admin/ultimas-visitas', latestVisits);

export default r;
