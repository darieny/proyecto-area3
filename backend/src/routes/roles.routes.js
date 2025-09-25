import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { rows } = await query('SELECT id, nombre FROM roles ORDER BY id ASC');
  res.json(rows);
});

export default router;
