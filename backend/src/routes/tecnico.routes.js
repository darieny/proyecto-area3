import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listMisVisitas,
  getVisitaDetalle,
  postEventoVisita,
  postEvidenciaVisita,
  getTecnicoSummary,
  setEstadoTecnico,            
} from '../controllers/tecnico.controller.js';

const r = Router();

// Todas requieren técnico autenticado
r.use(requireAuth, requireRole(['tecnico']));

// Listado y detalle
r.get('/visitas', listMisVisitas);
r.get('/visitas/:id', getVisitaDetalle);

// === Cambiar estado (2 formas compatibles) ===
r.post('/visitas/:id/eventos', postEventoVisita);
r.patch('/visitas/:id/estado', setEstadoTecnico);  

// Evidencias
r.post('/visitas/:id/evidencias', postEvidenciaVisita);

// Resumen del técnico
r.get('/summary', getTecnicoSummary);

export default r;

