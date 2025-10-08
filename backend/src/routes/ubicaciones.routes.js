import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createUbicacion, listUbicacionesByCliente } from '../controllers/ubicaciones.controller.js';

const r = Router();

r.use(requireAuth, requireRole(['admin']));

// crear ubicación
r.post('/', createUbicacion);

// listar ubicaciones por clientes
r.get('/by-cliente/:clienteId', listUbicacionesByCliente);

export default r;
