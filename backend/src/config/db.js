import 'dotenv/config';
import { Pool } from 'pg';

const {
  DB_HOST = "localhost",
  DB_PORT = '5432',
  DB_NAME,
  DB_USER,
  DB_PASS
} = process.env;

export const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

export async function pingDb() {
  const { rows } = await pool.query('SELECT NOW() AS now;');
  return rows[0].now;
}

export function query(text, params) {
  return pool.query(text, params);
}
