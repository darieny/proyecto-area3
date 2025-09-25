// backend/src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

import { pingDb, query } from './config/db.js';
import { signAccess } from './utils/jwt.js';
import rolesRoutes from './routes/roles.routes.js';

const app = express();

/* ===================== CORS abierto (Bearer) ===================== */
/* Usamos '*', y credentials:false porque NO usamos cookies httpOnly. */
const corsOptions = {
  origin: '*',
  credentials: false,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // responder preflight
/* ================================================================ */

app.use(cookieParser());
app.use(express.json());

// GET https://<app>.vercel.app/api
app.get('/', (_req, res) => {
  res.type('text').send('conexión lista');
});

// GET https://<app>.vercel.app/api/health
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'backend-area3' });
});

// GET https://<app>.vercel.app/api/db-ping
app.get('/db-ping', async (_req, res) => {
  try {
    const now = await pingDb();
    res.json({ ok: true, now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

//
const loginHandler = async (req, res) => {
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
    res.status(500).json({ ok: false, error: e.message });
  }
};

app.post('/login', loginHandler);        // ruta principal
app.post('/auth/login', loginHandler);   // alias (compatibilidad)
app.use('/roles', rolesRoutes);

export default app;



