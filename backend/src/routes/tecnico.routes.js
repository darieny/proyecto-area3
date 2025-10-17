import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listMisVisitas,
  getVisitaDetalle,
  postEventoVisita,
  postEvidenciaVisita,
  getTecnicoSummary
} from '../controllers/tecnico.controller.js';

const r = Router();
r.use(requireAuth, requireRole(['tecnico']));

r.get('/visitas', listMisVisitas);
r.get('/visitas/:id', getVisitaDetalle);
r.post('/visitas/:id/eventos', postEventoVisita);     // cambiar estado + log + real_inicio/fin
r.post('/visitas/:id/evidencias', postEvidenciaVisita); 
r.get('/summary', getTecnicoSummary);

export default r;
