// Solo reenvía a "app" de Express, ya que sino, no reconoce la ruta
import app from '../../src/app.js';
export default function handler(req, res) { return app(req, res); }
