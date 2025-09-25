// backend/src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pingDb } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import rolesRoutes from './routes/roles.routes.js';

const app = express();

// Para pruebas, puedes dejar "*".
// Cuando subas el front a Vercel, cámbialo a "https://tu-frontend.vercel.app"
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// GET https://<tuapp>.vercel.app/api
app.get('/', (_req, res) => {
  res.type('text').send('conexión lista');
});

// GET https://<tuapp>.vercel.app/api/health
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'backend-area3' });
});

app.get('/db-ping', async (_req, res) => {
  try {
    const now = await pingDb();
    res.json({ ok: true, now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Rutas de negocio (ya quedan expuestas bajo /api/*)
app.use('/auth', authRoutes);
app.use('/roles', rolesRoutes);

export default app;

