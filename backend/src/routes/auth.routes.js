import { Router } from 'express';
import { query } from '../config/db.js';
import { signAccess } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

/** POST /api/auth/login
 * body: { correo, password }
 * res: { ok, token, user }
 */
router.post('/login', async (req, res) => {
  try {
    const { correo, password } = req.body || {};
    if (!correo || !password) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const { rows } = await query(
      `SELECT u.id, u.nombre_completo, u.correo, u.password_hash, u.activo,
              r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.correo = $1
       LIMIT 1`,
      [correo]
    );

    const user = rows[0];
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signAccess({
      id: user.id,
      rol: user.rol,
      correo: user.correo,
      nombre: user.nombre_completo,
    });

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        nombre: user.nombre_completo,
        correo: user.correo,
        rol: user.rol,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/auth/me (protegida) */
router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

export default router;
