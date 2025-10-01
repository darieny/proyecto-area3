import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { pingDb } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import clientesRoutes from './routes/clientes.routes.js';

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN, credentials: true }));

app.use(cookieParser());
app.use(express.json());

// Pings /health
app.get('/', (_req, res) => {
  res.type('text').send('conexión lista');});
app.get('/api', (_req, res) => res.type('text').send('api viva'));
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

app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clientes', clientesRoutes);

// Alias temporal: /api/login → /api/auth/login
app.post('/login', (req, res, next) => {
  req.url = '/login';
  return authRoutes(req, res, next);
});

export default app;



