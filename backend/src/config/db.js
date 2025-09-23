// src/config/db.js
import 'dotenv/config';
import { Pool } from 'pg';

// Usa DATABASE_URL de Vercel Postgres (Neon)
const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.warn('DATABASE_URL no está definida. Endpoints que tocan DB fallarán.');
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  // Si tu proveedor requiriera SSL explícito adicional, descomenta:
  // ssl: { rejectUnauthorized: false },
  keepAlive: true,
});

export async function pingDb() {
  const { rows } = await pool.query('SELECT NOW() AS now;');
  return rows[0].now;
}

export function query(text, params) {
  return pool.query(text, params);
}

