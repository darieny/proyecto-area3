import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs'; // usa bcryptjs para evitar binarios nativos
import { query } from '../config/db.js';
import { signAccessToken, signRefreshToken, verifyRefresh } from '../utils/jwt.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// sonda
router.get('/ping', (_req, res) => res.json({ ok: true, where: 'auth' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

// --- deja SOLO este handler mínimo por ahora ---
router.post('/login', (_req, res) => res.json({ ok: true, reached: 'login' }));

export default router;

