import { query } from '../config/db.js';

/* ---------- helpers ---------- */
function normalizarEstado(v) {
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (s === 'activo' || s === 'inactivo') return s;
    if (s === 'true') return 'activo';
    if (s === 'false') return 'inactivo';
  }
  if (typeof v === 'boolean') return v ? 'activo' : 'inactivo';
  return undefined;
}
function estadoBool(txt) {
  return typeof txt === 'string' ? txt.toLowerCase() === 'activo' : null;
}
function pick(body) {
  const {
    nombre, nit, telefono, correo,
    direccion_linea1, direccion_linea2,
    ciudad, departamento, notas, estado
  } = body;
  return {
    nombre, nit, telefono, correo,
    direccion_linea1, direccion_linea2,
    ciudad, departamento, notas,
    estado: normalizarEstado(estado)
  };
}

/* ---------- GET /api/clientes ---------- */
export async function listClientes(req, res) {
  const {
    search = '',
    departamento,
    estado,
    order = 'recientes', // 'recientes' | 'nombre_asc' | 'nombre_desc'
    page = '1',
    pageSize = '10'
  } = req.query;

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10));
  const offset = (p - 1) * ps;

  const params = [];
  const where = [];

  if (search?.trim()) {
    params.push(`%${search.trim()}%`);
    where.push(`(
      nombre ILIKE $${params.length} OR
      nit ILIKE $${params.length} OR
      correo ILIKE $${params.length} OR
      telefono ILIKE $${params.length} OR
      ciudad ILIKE $${params.length} OR
      departamento ILIKE $${params.length}
    )`);
  }
  if (departamento?.trim()) {
    params.push(departamento.trim());
    where.push(`departamento = $${params.length}`);
  }
  if (typeof estado !== 'undefined') {
    const est = normalizarEstado(estado);
    if (est) {
      params.push(est);
      where.push(`estado = $${params.length}`);
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  // si no esta created_at aún, ORDER BY id DESC equivale a "recientes"
  const orderSql =
    order === 'nombre_asc'  ? 'ORDER BY nombre ASC'  :
    order === 'nombre_desc' ? 'ORDER BY nombre DESC' :
    'ORDER BY id DESC';

  const [{ rows }, { rows: crows }] = await Promise.all([
    query(`
      SELECT id, nombre, nit, telefono, correo,
             direccion_linea1, direccion_linea2,
             ciudad, departamento, notas, estado
      FROM clientes
      ${whereSql}
      ${orderSql}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, ps, offset]),
    query(`SELECT COUNT(*)::int AS total FROM clientes ${whereSql}`, params)
  ]);

  res.json({
    data: rows.map(r => ({ ...r, estado_bool: estadoBool(r.estado) })),
    meta: { total: crows[0]?.total ?? 0, page: p, pageSize: ps, totalPages: Math.ceil((crows[0]?.total ?? 0)/ps) }
  });
}

/* ---------- GET /api/clientes/:id ---------- */
export async function getCliente(req, res) {
  const { id } = req.params;
  const { rows } = await query(`
    SELECT id, nombre, nit, telefono, correo,
           direccion_linea1, direccion_linea2,
           ciudad, departamento, notas, estado
    FROM clientes WHERE id = $1
  `, [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
  const r = rows[0];
  res.json({ ...r, estado_bool: estadoBool(r.estado) });
}

/* ---------- POST /api/clientes ---------- */
export async function createCliente(req, res) {
  const c = pick(req.body);
  if (!c.nombre?.trim()) return res.status(400).json({ error: 'nombre es requerido' });

  const { rows } = await query(`
    INSERT INTO clientes (
      nombre, nit, telefono, correo,
      direccion_linea1, direccion_linea2,
      ciudad, departamento, notas, estado
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10,'activo'))
    RETURNING id, nombre, nit, telefono, correo, ciudad, departamento, notas, estado
  `, [
    c.nombre?.trim() ?? null,
    c.nit ?? null,
    c.telefono ?? null,
    c.correo ?? null,
    c.direccion_linea1 ?? null,
    c.direccion_linea2 ?? null,
    c.ciudad ?? null,
    c.departamento ?? null,
    c.notas ?? null,
    c.estado ?? null
  ]);
  res.status(201).json(rows[0]);
}

/* ---------- PUT /api/clientes/:id ---------- */
export async function updateCliente(req, res) {
  const { id } = req.params;
  const c = pick(req.body);

  const { rows } = await query(`
    UPDATE clientes
    SET
      nombre = COALESCE($1, nombre),
      nit = COALESCE($2, nit),
      telefono = COALESCE($3, telefono),
      correo = COALESCE($4, correo),
      direccion_linea1 = COALESCE($5, direccion_linea1),
      direccion_linea2 = COALESCE($6, direccion_linea2),
      ciudad = COALESCE($7, ciudad),
      departamento = COALESCE($8, departamento),
      notas = COALESCE($9, notas),
      estado = COALESCE($10, estado)
    WHERE id = $11
    RETURNING id, nombre, nit, telefono, correo, ciudad, departamento, notas, estado
  `, [
    c.nombre ?? null, c.nit ?? null, c.telefono ?? null, c.correo ?? null,
    c.direccion_linea1 ?? null, c.direccion_linea2 ?? null,
    c.ciudad ?? null, c.departamento ?? null, c.notas ?? null, c.estado ?? null,
    id
  ]);

  if (!rows?.length) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(rows[0]);
}

/* ---------- PATCH /api/clientes/:id/estado ---------- */
export async function patchEstado(req, res) {
  const { id } = req.params;

  let nuevo = normalizarEstado(req.body?.estado);
  if (!nuevo && typeof req.body?.activo === 'boolean') {
    nuevo = req.body.activo ? 'activo' : 'inactivo';
  }
  if (!nuevo) {
    // toggle si no envían valor
    const { rows: curr } = await query(`SELECT estado FROM clientes WHERE id = $1`, [id]);
    if (!curr[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    nuevo = curr[0].estado?.toLowerCase() === 'activo' ? 'inactivo' : 'activo';
  }

  const { rows } = await query(`
    UPDATE clientes SET estado = $1 WHERE id = $2
    RETURNING id, estado
  `, [nuevo, id]);

  res.json({ id: rows[0].id, estado: rows[0].estado, estado_bool: estadoBool(rows[0].estado) });
}

/* ---------- KPIs: GET /api/clientes/admin/summary ---------- */
export async function adminClientesSummary(_req, res) {
  const { rows: totalR } = await query(`SELECT COUNT(*)::int AS total FROM clientes`);
  // de momento reporte del mes irá en 0 porque aun no está created_at en la BD
  let nuevos_mes = 0;
  try {
    const { rows } = await query(`
      SELECT COUNT(*)::int AS n
      FROM clientes
      WHERE date_trunc('month', created_at) = date_trunc('month', NOW())
    `);
    nuevos_mes = rows[0]?.n ?? 0;
  } catch { nuevos_mes = 0; }

  // si no existe visitas, dejamos 0
  let sin_visitas = 0;
  try {
    const { rows } = await query(`
      SELECT COUNT(*)::int AS n
      FROM clientes c
      LEFT JOIN visitas v ON v.cliente_id = c.id
      WHERE v.id IS NULL
    `);
    sin_visitas = rows[0]?.n ?? 0;
  } catch { sin_visitas = 0; }

  res.json({ total: totalR[0]?.total ?? 0, nuevos_mes, sin_visitas });
}



/** DELETE CLIENTE */
export async function deleteOne(req, res, next) {
  try {
    const id = Number(req.params.id);

    // Verifica que exista
    const { rows: exists } = await query(`SELECT id FROM clientes WHERE id=$1`, [id]);
    if (!exists[0]) return res.status(404).json({ error: 'Cliente no encontrado' });

    await query('BEGIN');
    try {
      // ON DELETE CASCADE
      await query(`DELETE FROM clientes WHERE id=$1`, [id]);
      await query('COMMIT');
      return res.json({ ok: true, deleted: id, cascade: true });
    } catch (e) {
      // Fallback (violación de FK)
      await query('ROLLBACK');
      if (e.code !== '23503') throw e; // error no es FK

      // Fallback manual
      await query('BEGIN');

      // 1) Borra hijos de visitas del cliente
      await query(`
        DELETE FROM visit_logs
         WHERE visita_id IN (SELECT id FROM visitas WHERE cliente_id=$1)
      `, [id]);
      await query(`
        DELETE FROM evidencias
         WHERE visita_id IN (SELECT id FROM visitas WHERE cliente_id=$1)
      `, [id]);
      await query(`
        DELETE FROM visita_observaciones
         WHERE visita_id IN (SELECT id FROM visitas WHERE cliente_id=$1)
      `, [id]);

      // 2) Borra visitas del cliente
      await query(`DELETE FROM visitas WHERE cliente_id=$1`, [id]);

      // 3) Borra ubicaciones del cliente
      await query(`DELETE FROM ubicaciones WHERE cliente_id=$1`, [id]);

      // 4) borra el cliente
      await query(`DELETE FROM clientes WHERE id=$1`, [id]);

      await query('COMMIT');
      return res.json({ ok: true, deleted: id, cascade: false });
    }
  } catch (e) {
    try { await query('ROLLBACK'); } catch {}
    next(e);
  }
}
