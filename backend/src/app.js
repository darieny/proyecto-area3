import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/index.js';
import { pingDb } from './config/db.js';

const app = express();

// --- Configuración de CORS ---
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');

// Orígenes permitidos (producción + local dev)
const allowedOrigins = [FRONTEND_ORIGIN, 'http://localhost:5173'];

const corsOptions = {
  origin(origin, cb) {
    // Permite requests sin origin (ej: server-to-server) o desde orígenes válidos
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Aplica CORS y habilita preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// --- Middlewares ---
app.use(cookieParser());
app.use(express.json());

// --- Rutas de prueba/health ---
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

// --- Rutas principales ---
app.use('/api', apiRoutes);

export default app;

