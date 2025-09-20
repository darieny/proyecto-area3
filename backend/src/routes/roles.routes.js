import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

/** Listar roles */
router.get('/', async (_req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, nombre, descripcion FROM roles ORDER BY id'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Crear rol */
router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body ?? {};
  if (!nombre || typeof nombre !== 'string') {
    return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
  }
  try {
    const { rows } = await query(
      'INSERT INTO roles (nombre, descripcion) VALUES ($1, $2) RETURNING id, nombre, descripcion',
      [nombre.trim(), descripcion ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
