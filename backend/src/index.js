import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pingDb } from './config/db.js';
import apiRoutes from './routes/index.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

app.get('/', (_req, res) => res.send('Backend Listo'));
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

app.use('/api', apiRoutes);

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});

