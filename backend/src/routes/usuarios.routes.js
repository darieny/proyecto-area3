import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as u from '../controllers/usuarios.controller.js';

const r = Router();
r.use(requireAuth, requireRole(['admin']));

r.get('/roles', u.listRoles);                     // para poblar <select>
r.get('/', u.listUsuarios);                       // tabla de usuarios
r.get('/tecnicos', u.listTecnicos);               // llenar <select> de visitas
r.post('/', u.createUsuario);                     // crear usuario (admin/sup/tecnico)
r.patch('/:id', u.updateUsuarioBasic);            // actualizar datos/rol/activo/supervisor
r.patch('/:id/password', u.updateUsuarioPassword);// cambiar contraseña (admin)
r.get('/:id', u.getUsuarioById);    // perfil/detalle
r.delete('/:id', u.deleteUsuario);  // soft delete (activo=false)

export default r;
