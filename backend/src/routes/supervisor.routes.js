import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { withEquipoSupervisor } from '../middleware/scope-supervisor.js';
import {
  supSummaryVisitas,
  supListVisitas,
  supPlanificarVisita,
  supListTecnicos,
  supListClientes, supGetCliente, supGetUbicacionPrincipal
} from '../controllers/supervisor.controller.js';

const r = Router();

r.use(requireAuth, requireRole(['supervisor']), withEquipoSupervisor);

r.get('/dashboard/summary', supSummaryVisitas);
r.get('/visitas', supListVisitas);
r.post('/visitas', supPlanificarVisita);
r.get('/tecnicos', supListTecnicos);
r.get('/clientes', supListClientes);
r.get('/clientes/:id', supGetCliente);
r.get('/clientes/:id/ubicacion-principal', supGetUbicacionPrincipal);

export default r;
