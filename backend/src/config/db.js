import 'dotenv/config';
import { Pool } from 'pg';

const { DATABASE_URL } = process.env;

export const pool = new Pool({
  connectionString: DATABASE_URL,
  // Si usas Neon u otro servicio que exige SSL:
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
});

export async function pingDb() {
  const { rows } = await pool.query('SELECT NOW() AS now;');
  return rows[0].now;
}

export function query(text, params) {
  return pool.query(text, params);
}
