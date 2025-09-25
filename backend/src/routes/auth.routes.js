// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { signAccessToken, signRefreshToken, verifyRefresh } from '../utils/jwt.js';
import { requireAuth } from '../middlewares/auth.js';

console.log('[auth] module evaluating…');

const router = Router();
console.log('[auth] router created');

router.use((req, _res, next) => {
  // Este middleware loguea TODA petición que entre a /auth/*
  console.log(`[auth] INCOMING ${req.method} ${req.path}`);
  next();
});

router.get('/ping', (_req, res) => {
  console.log('[auth] /ping reached');
  res.json({ ok: true, where: 'auth' });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});
console.log('[auth] rateLimiter ready');

function setAuthCookies(res, user) {
  console.log('[auth] setAuthCookies for user id=', user?.id);
  const accessToken = signAccessToken({
    id: user.id,
    rol: user.rol_nombre,
    correo: user.correo,
    nombre: user.nombre_completo,
  });
  const refreshToken = signRefreshToken({ id: user.id });

  const secure = String(process.env.COOKIE_SECURE || 'false') === 'true';
  const sameSite = (process.env.COOKIE_SAMESITE || 'lax');
  const opts = { httpOnly: true, secure, sameSite };

  res.cookie('accessToken', accessToken, { ...opts, maxAge: 1000 * 60 * 15 });
  res.cookie('refreshToken', refreshToken, { ...opts, maxAge: 1000 * 60 * 60 * 24 * 7 });
}

router.post('/login', limiter, async (req, res) => {
  console.log('[auth] /login body=', req.body);
  const { correo, password } = req.body || {};
  if (!correo || !password) {
    console.log('[auth] /login missing creds');
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
    console.log('[auth] querying user by correo=', correo);
    const { rows } = await query(
      `SELECT u.*, r.nombre AS rol_nombre
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.correo = $1`,
      [correo]
    );
    const user = rows[0];
    console.log('[auth] user query result rows=', rows?.length);

    const now = new Date();

    if (!user || !user.activo) {
      console.log('[auth] invalid/disabled user');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.locked_until && new Date(user.locked_until) > now) {
      console.log('[auth] account locked until', user.locked_until);
      return res.status(423).json({ error: 'Cuenta bloqueada temporalmente. Intenta más tarde.' });
    }

    if (user.must_change_password && user.temp_password_expires_at && new Date(user.temp_password_expires_at) < now) {
      console.log('[auth] temp password expired');
      return res.status(403).json({ error: 'La contraseña temporal expiró. Solicita un restablecimiento.' });
    }

    console.log('[auth] comparing password…');
    const ok = await bcrypt.compare(password, user.password_hash);
    console.log('[auth] password match =', ok);

    if (!ok) {
      const max = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
      const lockMin = Number(process.env.LOGIN_LOCK_MINUTES || 15);
      const attempts = (user.login_attempts || 0) + 1;
      let lockedUntil = null;
      if (attempts >= max) {
        lockedUntil = new Date(Date.now() + lockMin * 60 * 1000);
      }
      console.log('[auth] bad password → attempts', attempts, 'lockedUntil', lockedUntil);
      await query(
        'UPDATE usuarios SET login_attempts = $1, locked_until = $2 WHERE id = $3',
        [attempts, lockedUntil, user.id]
      );
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    await query(
      'UPDATE usuarios SET login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1',
      [user.id]
    );
    console.log('[auth] login success, setting cookies');
    setAuthCookies(res, user);

    const payload = {
      id: user.id,
      nombre_completo: user.nombre_completo,
      correo: user.correo,
      rol: user.rol_nombre,
      must_change_password: user.must_change_password,
    };
    console.log('[auth] responding with user payload');
    return res.json({ user: payload });
  } catch (e) {
    console.error('[auth] /login error:', e);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;
  console.log('[auth] /refresh token present:', Boolean(token));
  if (!token) return res.status(401).json({ error: 'Sin refresh token' });
  try {
    const payload = verifyRefresh(token);
    console.log('[auth] /refresh payload=', payload?.id);
    const { rows } = await query(
      `SELECT u.*, r.nombre AS rol_nombre
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = $1`,
      [payload.id]
    );
    const user = rows[0];
    if (!user || !user.activo) {
      console.log('[auth] /refresh user inactive/not found');
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    setAuthCookies(res, user);
    res.json({ ok: true });
  } catch (e) {
    console.log('[auth] /refresh invalid token', e?.message);
    return res.status(401).json({ error: 'Refresh inválido' });
  }
});

router.post('/logout', (_req, res) => {
  console.log('[auth] /logout clearing cookies');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[auth] /me for user', userId);
    const { rows } = await query(
      `SELECT u.id, u.nombre_completo, u.correo, u.telefono, u.must_change_password,
              u.last_login_at, u.activo, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = $1`,
      [userId]
    );
    const user = rows[0];
    if (!user) {
      console.log('[auth] /me user not found');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user });
  } catch (e) {
    console.error('[auth] /me error:', e);
    res.status(500).json({ error: 'Error obteniendo el perfil' });
  }
});

console.log('[auth] routes registered: GET /ping, POST /login, POST /refresh, POST /logout, GET /me');
export default router;


