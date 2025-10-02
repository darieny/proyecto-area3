// backend/src/routes/dashboard.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { adminSummary, latestVisits } from '../controllers/dashboard.controller.js';

const r = Router();

r.get('/ping', (_req, res) => res.json({ ok: true, route: '/dashboard/ping' }));

// raíz del módulo: responde a GET /api/dashboard
r.get('/', (_req, res) => {
  res.json({ ok: true, module: 'dashboard', msg: 'dashboard root' });
});

// >>> BYPASS de preflight antes de la auth <<<
r.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Solo usuarios autenticados con rol admin
r.use(requireAuth, requireRole(['admin']));

r.get('/admin/summary', adminSummary);
r.get('/admin/ultimas-visitas', latestVisits);

export default r;
