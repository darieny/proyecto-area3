import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { pingDb } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import ubicacionesRoutes from './routes/ubicaciones.routes.js';
import visitasRoutes from './routes/visitas.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN, credentials: true }));

app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Pings /health
app.get('/', (_req, res) => {
  res.type('text').send('conexión lista');});
app.get('/api', (_req, res) => res.type('text').send('api viva'));
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend-area3' });
});
//Prueba de post login
app.post('/api/auth/login-test', (req, res) => {
  res.json({ ok: true, hit: 'POST /api/auth/login-test', body: req.body || null });
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
app.use('/api/ubicaciones', ubicacionesRoutes);
app.use('/api/visitas', visitasRoutes);
app.use('/api/usuarios', usuariosRoutes);

export default app;



