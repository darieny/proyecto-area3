import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

// ---- GET /usuarios/roles
export async function listRoles(_req, res) {
  const { rows } = await query('SELECT id, nombre FROM roles ORDER BY id;');
  res.json(rows);
}

// ---- GET /usuarios?search=&rol_id=&activo=
export async function listUsuarios(req, res) {
  const { search = '', rol_id, activo } = req.query;
  const params = [];
  const where = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(`(u.nombre_completo ILIKE $${params.length} OR u.correo ILIKE $${params.length})`);
  }
  if (rol_id) {
    params.push(rol_id);
    where.push(`u.rol_id = $${params.length}::bigint`);
  }
  if (activo !== undefined) {
    params.push(activo === 'true');
    where.push(`u.activo = $${params.length}::boolean`);
  }

  const sql = `
    SELECT u.id, u.nombre_completo, u.correo, u.telefono, u.activo,
           r.nombre AS rol, u.rol_id, u.supervisor_id
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY u.id DESC
    LIMIT 100;
  `;
  const { rows } = await query(sql, params);
  res.json(rows);
}

// ---- GET /usuarios/tecnicos
export async function listTecnicos(_req, res) {
  const { rows } = await query(`
    SELECT u.id, u.nombre_completo
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE r.nombre = 'tecnico' AND u.activo = TRUE
    ORDER BY u.nombre_completo;
  `);
  res.json(rows);
}

// ---- POST /usuarios
// body: { nombre_completo, correo, telefono?, rol_id, supervisor_id?, password }
export async function createUsuario(req, res) {
  const { nombre_completo, correo, telefono, rol_id, supervisor_id, password } = req.body;

  if (!nombre_completo || !correo || !rol_id || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // validar supervisor si viene
  if (supervisor_id) {
    const sup = await query(`
      SELECT 1
      FROM usuarios u JOIN roles r ON r.id=u.rol_id
      WHERE u.id=$1::bigint AND r.nombre='supervisor'
    `, [supervisor_id]);
    if (!sup.rowCount) return res.status(400).json({ error: 'supervisor_id no es un supervisor válido' });
  }

  const passHash = await bcrypt.hash(password, 10);

  try {
    // crear usuario
    const ins = await query(`
      INSERT INTO usuarios
        (nombre_completo, correo, telefono, rol_id, supervisor_id, password_hash, creado_por)
      VALUES
        ($1::text, $2::text, $3::text, $4::bigint, $5::bigint, $6::text, $7::bigint)
      RETURNING id, nombre_completo, correo, rol_id
    `, [
      nombre_completo,
      correo,
      telefono || null,
      rol_id,
      supervisor_id || null,
      passHash,
      req.user?.id ?? null,
    ]);

    const user = ins.rows[0];

    // si es técnico, crear/activar fila espejo en "tecnicos"
    const rol = await query('SELECT nombre FROM roles WHERE id=$1::bigint', [rol_id]);
    if (rol.rows[0]?.nombre === 'tecnico') {
      await query(`
        INSERT INTO tecnicos (usuario_id, codigo, activo)
        VALUES ($1::bigint, CONCAT('TEC-', $2::text), TRUE)
        ON CONFLICT (usuario_id)
        DO UPDATE SET activo = TRUE, codigo = EXCLUDED.codigo
      `, [user.id, String(user.id)]);
    }

    res.status(201).json(user);
  } catch (e) {
    // correo UNIQUE
    if (e?.code === '23505' && e?.constraint === 'usuarios_correo_key') {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    throw e;
  }
}

// ---- PATCH /usuarios/:id
// body (opcionales): { nombre_completo, telefono, rol_id, supervisor_id, activo }
export async function updateUsuarioBasic(req, res) {
  const { id } = req.params;
  const { nombre_completo, telefono, rol_id, supervisor_id, activo } = req.body;

  if (supervisor_id) {
    const sup = await query(`
      SELECT 1
      FROM usuarios u JOIN roles r ON r.id=u.rol_id
      WHERE u.id=$1::bigint AND r.nombre='supervisor'
    `, [supervisor_id]);
    if (!sup.rowCount) return res.status(400).json({ error: 'supervisor_id no es un supervisor válido' });
  }

  const { rows } = await query(`
    UPDATE usuarios
       SET nombre_completo = COALESCE($1::text, nombre_completo),
           telefono       = COALESCE($2::text, telefono),
           rol_id         = COALESCE($3::bigint, rol_id),
           supervisor_id  = COALESCE($4::bigint, supervisor_id),
           activo         = COALESCE($5::boolean, activo)
     WHERE id = $6::bigint
     RETURNING id, rol_id
  `, [
    nombre_completo ?? null,
    telefono ?? null,
    rol_id ?? null,
    supervisor_id ?? null,
    (activo === undefined ? null : !!activo),
    id,
  ]);

  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

  // mantener tabla tecnicos sincronizada si cambia el rol
  if (rol_id) {
    const r = await query('SELECT nombre FROM roles WHERE id=$1::bigint', [rol_id]);
    const esTec = r.rows[0]?.nombre === 'tecnico';
    if (esTec) {
      await query(`
        INSERT INTO tecnicos (usuario_id, codigo, activo)
        VALUES ($1::bigint, CONCAT('TEC-', $2::text), TRUE)
        ON CONFLICT (usuario_id)
        DO UPDATE SET activo = TRUE, codigo = EXCLUDED.codigo
      `, [id, String(id)]);
    } else {
      await query('UPDATE tecnicos SET activo=FALSE WHERE usuario_id=$1::bigint', [id]);
    }
  }

  res.json({ ok: true });
}

// ---- PATCH /usuarios/:id/password { password }
export async function updateUsuarioPassword(req, res) {
  const { id } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'password requerido' });

  const passHash = await bcrypt.hash(password, 10);
  const { rowCount } = await query(`
    UPDATE usuarios
       SET password_hash=$1::text, must_change_password=FALSE
     WHERE id=$2::bigint
  `, [passHash, id]);

  if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ ok: true });
}

// ---- GET /usuarios/:id
export async function getUsuarioById(req, res) {
  const { id } = req.params;
  const { rows } = await query(`
    SELECT
      u.id, u.nombre_completo, u.correo, u.telefono, u.activo,
      u.rol_id, r.nombre AS rol,
      u.supervisor_id, sup.nombre_completo AS supervisor_nombre
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    LEFT JOIN usuarios sup ON sup.id = u.supervisor_id
    WHERE u.id = $1::bigint
  `, [id]);

  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(rows[0]);
}

// ---- DELETE /usuarios/:id (soft delete)
export async function deleteUsuario(req, res) {
  const { id } = req.params;

  const { rowCount } = await query(`
    UPDATE usuarios
       SET activo = FALSE
     WHERE id = $1::bigint
  `, [id]);

  if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });

  await query(`UPDATE tecnicos SET activo = FALSE WHERE usuario_id = $1::bigint`, [id]);

  res.json({ ok: true });
}

