import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as ctrl from '../controllers/visitas.controller.js';

const r = Router();

r.get('/ping', (_req, res) => res.json({ ok: true, route: '/visitas/ping' }));

// Por ahora, todo sólo admin
r.use(requireAuth, requireRole(['admin']));

// Lista general + detalle
r.get('/', ctrl.list);
r.get('/:id', ctrl.getOne);

// Update genérico (campos editables)
r.put('/:id', ctrl.updateOne);

// Cambiar estado (con logs)
r.patch('/:id/estado', ctrl.patchEstado);

// Observaciones
r.get('/:id/observaciones', ctrl.getObservaciones);
r.post('/:id/observaciones', ctrl.postObservacion);

// Evidencias
r.get('/:id/evidencias', ctrl.getEvidencias);
r.post('/:id/evidencias', ctrl.postEvidencia);

// Logs
r.get('/:id/logs', ctrl.getLogs);

export default r;
