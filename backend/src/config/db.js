// backend/src/config/db.js
import 'dotenv/config';
import { Pool } from 'pg';

function makePool() {
  const url = process.env.DATABASE_URL;

  if (url) {
    // Producción (Neon/Vercel) o cuando quieras usar la URL completa.
    // Activa SSL si la URL lo pide o lo fuerza una env.
    const needSSL =
      /sslmode=require/i.test(url) ||
      process.env.PGSSLMODE === 'require' ||
      process.env.DB_SSL === 'true';

    return new Pool({
      connectionString: url,
      ssl: needSSL ? { rejectUnauthorized: false } : false,
      keepAlive: true,
    });
  }

  // Local clásico con variables sueltas (por defecto sin SSL)
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: false,
    keepAlive: true,
  });
}

export const pool = makePool();

export async function pingDb() {
  const { rows } = await pool.query('SELECT NOW() AS now;');
  return rows[0].now;
}

export function query(text, params) {
  return pool.query(text, params);
}
