import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listClientes, getCliente, createCliente, updateCliente, patchEstado, adminClientesSummary
} from '../controllers/clientes.controller.js';
import { createForCliente } from '../controllers/visitas.controller.js';

const r = Router();

r.get('/ping', (_req, res) => res.json({ ok: true, route: '/clientes/ping' }));

r.use(requireAuth, requireRole(['admin']));

r.get('/admin/summary', adminClientesSummary);
r.get('/', listClientes);
r.get('/:id', getCliente);
r.post('/', createCliente);
r.put('/:id', updateCliente);
r.patch('/:id/estado', patchEstado);
r.post('/:clienteId/visitas', createForCliente);

export default r;

