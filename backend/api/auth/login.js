// Reenvía a la app de Express asegurando la ruta correcta
import app from '../../src/app.js';

export default function handler(req, res) {
  // Normaliza: "/api/auth/login" -> "/auth/login" para Express
  if (req.url && req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  return app(req, res);
}
