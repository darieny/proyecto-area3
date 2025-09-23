// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/index.js'; // tus rutas existentes
import { pingDb } from './config/db.js';

const app = express();

// CORS: mientras no tengas el front en Vercel, usa localhost; luego cámbialo al dominio real
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Rutas de prueba/health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend-area3' });
});

app.get('/api/db-ping', async (_req, res) => {
  try {
    const now = await pingDb();
    res.json({ ok: true, now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Monta tus rutas reales SIN prefijo '/api' para evitar /api/api
// Si dentro de routes/index.js ya usas subrutas (/auth, /roles, etc.),
// quedarán accesibles como: https://<tu-backend>.vercel.app/auth, /roles, ...
app.use('/api', apiRoutes);

export default app;
