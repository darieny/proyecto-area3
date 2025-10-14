import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

// ---- GET /roles
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
    where.push(`u.rol_id = $${params.length}`);
  }
  if (activo !== undefined) {
    params.push(activo === 'true');
    where.push(`u.activo = $${params.length}`);
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

  // si manda supervisor_id, debe ser rol supervisor
  if (supervisor_id) {
    const sup = await query(`
      SELECT 1 FROM usuarios u JOIN roles r ON r.id=u.rol_id
      WHERE u.id=$1 AND r.nombre='supervisor'
    `, [supervisor_id]);
    if (!sup.rowCount) return res.status(400).json({ error: 'supervisor_id no es un supervisor válido' });
  }

  const passHash = await bcrypt.hash(password, 10);

  // creamos usuario
  const ins = await query(`
    INSERT INTO usuarios (nombre_completo, correo, telefono, rol_id, supervisor_id, password_hash, creado_por)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id, nombre_completo, correo, rol_id
  `, [nombre_completo, correo, telefono || null, rol_id, supervisor_id || null, passHash, req.user?.id || null]);

  const user = ins.rows[0];

  // si es técnico, creamos fila espejo en "tecnicos" (id autogenerado como código simple)
  const rol = await query('SELECT nombre FROM roles WHERE id=$1', [rol_id]);
  if (rol.rows[0]?.nombre === 'tecnico') {
    await query(`
      INSERT INTO tecnicos (usuario_id, codigo, activo)
      VALUES ($1, CONCAT('TEC-', $1), TRUE)
      ON CONFLICT (usuario_id) DO NOTHING
    `, [user.id]);
  }

  res.status(201).json(user);
}

// ---- PATCH /usuarios/:id
// body (todos opcionales): { nombre_completo, telefono, rol_id, supervisor_id, activo }
export async function updateUsuarioBasic(req, res) {
  const { id } = req.params;
  const { nombre_completo, telefono, rol_id, supervisor_id, activo } = req.body;

  // si cambia supervisor, valida que sea rol supervisor
  if (supervisor_id) {
    const sup = await query(`
      SELECT 1 FROM usuarios u JOIN roles r ON r.id=u.rol_id
      WHERE u.id=$1 AND r.nombre='supervisor'
    `, [supervisor_id]);
    if (!sup.rowCount) return res.status(400).json({ error: 'supervisor_id no es un supervisor válido' });
  }

  // actualizar datos básicos
  const { rows } = await query(`
    UPDATE usuarios
    SET nombre_completo = COALESCE($1, nombre_completo),
        telefono       = COALESCE($2, telefono),
        rol_id         = COALESCE($3, rol_id),
        supervisor_id  = COALESCE($4, supervisor_id),
        activo         = COALESCE($5, activo)
    WHERE id = $6
    RETURNING id, rol_id
  `, [nombre_completo || null, telefono || null, rol_id || null, supervisor_id || null, activo ?? null, id]);

  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

  // mantener tabla tecnicos sincronizada si cambia el rol
  if (rol_id) {
    const rol = await query('SELECT nombre FROM roles WHERE id=$1', [rol_id]);
    const esTec = rol.rows[0]?.nombre === 'tecnico';
    if (esTec) {
      await query(`
        INSERT INTO tecnicos (usuario_id, codigo, activo)
        VALUES ($1, CONCAT('TEC-', $1), TRUE)
        ON CONFLICT (usuario_id) DO NOTHING
      `, [id]);
    } else {
      // si deja de ser técnico, desactiva registro
      await query('UPDATE tecnicos SET activo=FALSE WHERE usuario_id=$1', [id]);
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
    UPDATE usuarios SET password_hash=$1, must_change_password=FALSE WHERE id=$2
  `, [passHash, id]);
  if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });

  res.json({ ok: true });
}
