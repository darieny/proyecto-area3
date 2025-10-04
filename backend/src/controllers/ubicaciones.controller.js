import { query } from '../config/db.js';

export async function createUbicacion(req, res) {
  const {
    cliente_id, etiqueta,
    direccion_linea1, direccion_linea2,
    ciudad, departamento, codigo_postal,
    latitud, longitud, place_id, notas
  } = req.body || {};

  if (!cliente_id) return res.status(400).json({ error: 'cliente_id es requerido' });
  if (!etiqueta?.trim()) return res.status(400).json({ error: 'etiqueta es requerida' });

  const { rows } = await query(`
    INSERT INTO ubicaciones (
      cliente_id, etiqueta, direccion_linea1, direccion_linea2,
      ciudad, departamento, codigo_postal, latitud, longitud, place_id, notas
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING id, cliente_id, etiqueta, direccion_linea1, direccion_linea2,
              ciudad, departamento, codigo_postal, latitud, longitud, place_id, notas
  `, [
    cliente_id, etiqueta.trim(),
    direccion_linea1 ?? null, direccion_linea2 ?? null,
    ciudad ?? null, departamento ?? null, codigo_postal ?? null,
    latitud ?? null, longitud ?? null, place_id ?? null, notas ?? null
  ]);

  res.status(201).json(rows[0]);
}

export async function listUbicacionesByCliente(req, res) {
  const { clienteId } = req.params;
  const { rows } = await query(`
    SELECT id, cliente_id, etiqueta, direccion_linea1, direccion_linea2,
           ciudad, departamento, codigo_postal, latitud, longitud, place_id, notas
    FROM ubicaciones
    WHERE cliente_id = $1
    ORDER BY id DESC
  `, [clienteId]);
  res.json(rows);
}
