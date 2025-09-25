// backend/src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

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

export default app;

