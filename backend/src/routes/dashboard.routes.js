import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as ctrl from '../controllers/dashboard.controller.js';

const r = Router();
r.use(requireAuth, requireRole(['admin']));

r.get('/admin/summary', ctrl.adminSummary);
r.get('/admin/latest-visits', ctrl.latestVisits);
// r.get('/admin/events', ctrl.upcomingEvents); // opcional

export default r;
