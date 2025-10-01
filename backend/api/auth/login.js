/** Solo reenvía a "app" de Express, ya que sino, no reconoce la ruta
import app from '../../src/app.js';
export default function handler(req, res) {
  // Normaliza: "/api/auth/login" -> "/auth/login"
  if (req.url && req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  return app(req, res);
}**/

