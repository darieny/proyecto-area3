import { query } from '../config/db.js';
import PDFDocument from 'pdfkit';
import { enviarCorreoVisita } from '../utils/sendgridMail.js';
import { buildVisitaEmail } from '../utils/emailTemplates.js';

/** =========================
 *   LEAN (sin servicios)
 * ========================= */
function parsePagination({ page = '1', pageSize = '10' }) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10));
  const offset = (p - 1) * ps;
  return { page: p, pageSize: ps, offset, limit: ps };
}

async function getDefaultStatusId() {
  const { rows } = await query(`
    SELECT ci.id
    FROM catalogo_items ci
    JOIN catalogo_grupos cg ON cg.id = ci.grupo_id
    WHERE cg.codigo = 'VISITA_STATUS' AND ci.por_defecto = TRUE
    LIMIT 1;
  `);
  if (!rows[0]) throw new Error('No hay status por defecto en VISITA_STATUS');
  return rows[0].id;
}

async function ensureUbicacionPerteneceACliente(ubicacion_id, cliente_id) {
  if (!ubicacion_id) return;
  const { rows } = await query(
    `SELECT 1 FROM ubicaciones WHERE id=$1 AND cliente_id=$2`,
    [ubicacion_id, cliente_id]
  );
  if (!rows[0]) throw new Error('ubicacion_id no pertenece al cliente');
}

/** Resolver id de catálogo desde id o código */
async function resolveCatalogId({ id, codigo, grupo }) {
  if (id != null && id !== '') return Number(id);
  if (!codigo) return null;
  const { rows } = await query(`
    SELECT ci.id
      FROM catalogo_items ci
      JOIN catalogo_grupos cg ON cg.id = ci.grupo_id
     WHERE cg.codigo = $1
       AND UPPER(ci.codigo) = UPPER($2)
     LIMIT 1
  `, [grupo, String(codigo)]);
  return rows[0]?.id ?? null;
}

/** Selección “normalizada” para lista/detalle (ADMIN) */
function buildSelectNormalizado() {
  return `
    v.id, v.cliente_id, c.nombre AS cliente_nombre,
    v.ubicacion_id, u.etiqueta AS ubicacion_etiqueta, u.ciudad AS ubicacion_ciudad, u.departamento AS ubicacion_departamento,
    v.titulo, v.descripcion,
    v.tecnico_asignado_id, tu.nombre_completo AS tecnico_nombre,
    v.creado_por_id, cu.nombre_completo AS creado_por_nombre,
    v.status_id,
    s.codigo   AS estado_codigo,
    s.etiqueta AS estado_label,
    s.etiqueta AS status_etiqueta,
    s.color    AS status_color,
    v.priority_id, pr.codigo AS priority_codigo, pr.etiqueta AS priority_etiqueta, pr.color AS priority_color,
    v.type_id,     ty.codigo AS type_codigo,     ty.etiqueta AS type_etiqueta,
    v.programada_inicio, v.programada_fin, v.real_inicio, v.real_fin
  `;
}

function orderSqlFrom(order) {
  switch (order) {
    case 'programadas_asc': return 'ORDER BY v.programada_inicio ASC NULLS LAST';
    case 'programadas_desc': return 'ORDER BY v.programada_inicio DESC NULLS LAST';
    case 'recientes':
    default: return 'ORDER BY v.id DESC';
  }
}

/** =========================
 * Listar visitas (ADMIN)
 * ========================= */
export async function list(req, res, next) {
  try {
    const { page, pageSize, order } = req.query;
    const { offset, limit } = parsePagination({ page, pageSize });

    const filters = {
      q: req.query.q,
      // soportamos ambas formas: por id numérico o por código textual
      status_id: req.query.status_id,
      estado: req.query.estado,                 // NUEVO: PROGRAMADA | EN_RUTA | …
      priority_id: req.query.priority_id,
      type_id: req.query.type_id,
      cliente_id: req.query.cliente_id,
      tecnico_id: req.query.tecnico_id,
      desde: req.query.desde,
      hasta: req.query.hasta,
    };

    const params = [];
    const where = [];

    if (filters.q) {
      params.push(`%${filters.q}%`);
      where.push(`(v.titulo ILIKE $${params.length} OR v.descripcion ILIKE $${params.length})`);
    }
    if (filters.status_id) { params.push(filters.status_id); where.push(`v.status_id = $${params.length}`); }
    if (filters.estado) { params.push(filters.estado); where.push(`UPPER(s.codigo) = UPPER($${params.length})`); } // NUEVO
    if (filters.priority_id) { params.push(filters.priority_id); where.push(`v.priority_id = $${params.length}`); }
    if (filters.type_id) { params.push(filters.type_id); where.push(`v.type_id = $${params.length}`); }
    if (filters.cliente_id) { params.push(filters.cliente_id); where.push(`v.cliente_id = $${params.length}`); }
    if (filters.tecnico_id) { params.push(filters.tecnico_id); where.push(`v.tecnico_asignado_id = $${params.length}`); }
    if (filters.desde) { params.push(filters.desde); where.push(`v.programada_inicio >= $${params.length}`); }
    if (filters.hasta) { params.push(filters.hasta); where.push(`v.programada_inicio < $${params.length}`); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql = orderSqlFrom(order);
    const selectNorm = buildSelectNormalizado();

    const sql = `
      SELECT ${selectNorm}
      FROM visitas v
      JOIN clientes c        ON c.id = v.cliente_id
      LEFT JOIN ubicaciones u ON u.id = v.ubicacion_id
      LEFT JOIN usuarios tu   ON tu.id = v.tecnico_asignado_id
      JOIN usuarios cu        ON cu.id = v.creado_por_id
      LEFT JOIN catalogo_items s  ON s.id  = v.status_id         -- importante para estado_codigo
      LEFT JOIN catalogo_items pr ON pr.id = v.priority_id
      LEFT JOIN catalogo_items ty ON ty.id = v.type_id
      ${whereSql}
      ${orderSql}
      LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}
    `;
    const { rows } = await query(sql, params);

    // COUNT con los mismos JOINs para que el filtro por estado funcione
    const countSql = `
      SELECT COUNT(*) AS total
      FROM visitas v
      JOIN clientes c        ON c.id = v.cliente_id
      LEFT JOIN ubicaciones u ON u.id = v.ubicacion_id
      LEFT JOIN usuarios tu   ON tu.id = v.tecnico_asignado_id
      JOIN usuarios cu        ON cu.id = v.creado_por_id
      LEFT JOIN catalogo_items s  ON s.id  = v.status_id
      LEFT JOIN catalogo_items pr ON pr.id = v.priority_id
      LEFT JOIN catalogo_items ty ON ty.id = v.type_id
      ${whereSql}
    `;
    const { rows: countRows } = await query(countSql, params.slice(0, params.length - 2));

    res.json({
      items: rows,
      meta: {
        total: Number(countRows[0].total),
        page: Number(page || 1),
        pageSize: Number(pageSize || 10),
      }
    });
  } catch (e) { next(e); }
}

/** =========================
 * Obtener una visita (detalle ADMIN)
 * ========================= */
export async function getOne(req, res, next) {
  try {
    const id = Number(req.params.id);
    const selectNorm = buildSelectNormalizado();
    const { rows } = await query(
      `
      SELECT ${selectNorm}
      FROM visitas v
      JOIN clientes c        ON c.id = v.cliente_id
      LEFT JOIN ubicaciones u ON u.id = v.ubicacion_id
      LEFT JOIN usuarios tu   ON tu.id = v.tecnico_asignado_id
      JOIN usuarios cu        ON cu.id = v.creado_por_id
      LEFT JOIN catalogo_items s  ON s.id  = v.status_id
      LEFT JOIN catalogo_items pr ON pr.id = v.priority_id
      LEFT JOIN catalogo_items ty ON ty.id = v.type_id
      WHERE v.id = $1
      `,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Visita no encontrada' });

    const { rows: obs } = await query(
      `SELECT COUNT(*)::int AS n FROM visita_observaciones WHERE visita_id=$1`,
      [id]
    );
    const { rows: evs } = await query(
      `SELECT COUNT(*)::int AS n FROM evidencias WHERE visita_id=$1`,
      [id]
    );

    res.json({ ...rows[0], observaciones_count: obs[0].n, evidencias_count: evs[0].n });
  } catch (e) { next(e); }
}

/** =========================
 * Crear visita desde un cliente
 * ========================= */
export async function createForCliente(req, res, next) {
  try {
    const clienteId = Number(req.params.clienteId);
    const b = req.body || {};

    // Validaciones mínimas
    if (!b.titulo) return res.status(400).json({ error: 'titulo requerido' });
    if (!b.creado_por_id) return res.status(400).json({ error: 'creado_por_id requerido' });
    if (b.programada_inicio && b.programada_fin) {
      if (new Date(b.programada_fin) <= new Date(b.programada_inicio)) {
        return res.status(400).json({ error: 'programada_fin debe ser > programada_inicio' });
      }
    }

    await ensureUbicacionPerteneceACliente(b.ubicacion_id, clienteId);

    // Normalizar tipo/prioridad (acepta id o código)
    const priorityId = await resolveCatalogId({
      id: b.priority_id,
      codigo: b.prioridad || b.priority_codigo,
      grupo: 'VISITA_PRIORIDAD',
    });
    const typeId = await resolveCatalogId({
      id: b.type_id,
      codigo: b.tipo || b.type_codigo,
      grupo: 'VISITA_TIPO',
    });

    const statusId = b.status_id || await getDefaultStatusId();

    const { rows } = await query(
      `INSERT INTO visitas
        (cliente_id, ubicacion_id, titulo, descripcion, tecnico_asignado_id, creado_por_id,
         status_id, priority_id, type_id, programada_inicio, programada_fin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        clienteId,
        b.ubicacion_id || null,
        b.titulo,
        b.descripcion || null,
        b.tecnico_asignado_id || null,
        b.creado_por_id,
        statusId,
        priorityId || null,   
        typeId || null,       
        b.programada_inicio || null,
        b.programada_fin || null
      ]
    );

    res.status(201).json({ id: rows[0].id });
  } catch (e) { next(e); }
}

/** =========================
 * Actualizar (PUT) campos editables
 * ========================= */
export async function updateOne(req, res, next) {
  try {
    const id = Number(req.params.id);
    const b = req.body || {};

    if (b.programada_inicio && b.programada_fin) {
      if (new Date(b.programada_fin) <= new Date(b.programada_inicio)) {
        return res.status(400).json({ error: 'programada_fin debe ser > programada_inicio' });
      }
    }

    // Si envían cliente_id y ubicacion_id juntos, validar relación
    if (b.cliente_id && b.ubicacion_id) {
      await ensureUbicacionPerteneceACliente(b.ubicacion_id, b.cliente_id);
    }

    // Permitir actualizar por código también
    if (b.prioridad || b.priority_codigo) {
      b.priority_id = await resolveCatalogId({
        id: b.priority_id,
        codigo: b.prioridad || b.priority_codigo,
        grupo: 'VISITA_PRIORIDAD'
      });
    }
    if (b.tipo || b.type_codigo) {
      b.type_id = await resolveCatalogId({
        id: b.type_id,
        codigo: b.tipo || b.type_codigo,
        grupo: 'VISITA_TIPO'
      });
    }

    const fields = [];
    const params = [];
    const push = (v) => (params.push(v), `$${params.length}`);

    if (b.titulo !== undefined) fields.push(`titulo=${push(b.titulo)}`);
    if (b.descripcion !== undefined) fields.push(`descripcion=${push(b.descripcion)}`);
    if (b.ubicacion_id !== undefined) fields.push(`ubicacion_id=${push(b.ubicacion_id)}`);
    if (b.tecnico_asignado_id !== undefined) fields.push(`tecnico_asignado_id=${push(b.tecnico_asignado_id)}`);
    if (b.priority_id !== undefined) fields.push(`priority_id=${push(b.priority_id)}`);
    if (b.type_id !== undefined) fields.push(`type_id=${push(b.type_id)}`);
    if (b.programada_inicio !== undefined) fields.push(`programada_inicio=${push(b.programada_inicio)}`);
    if (b.programada_fin !== undefined) fields.push(`programada_fin=${push(b.programada_fin)}`);

    if (!fields.length) return res.status(400).json({ error: 'Nada para actualizar' });

    params.push(id);
    await query(`UPDATE visitas SET ${fields.join(', ')} WHERE id=$${params.length}`, params);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

/** =========================
 * Cambiar estado (PATCH) + logs
 * ========================= */
export async function patchEstado(req, res, next) {
  try {
    const visitaId = Number(req.params.id);
    const { estado_nuevo_id, nota, autor_id } = req.body || {};
    if (!estado_nuevo_id) return res.status(400).json({ error: 'estado_nuevo_id requerido' });
    if (!autor_id) return res.status(400).json({ error: 'autor_id requerido' });

    const { rows: curr } = await query(`SELECT status_id, real_inicio, real_fin FROM visitas WHERE id=$1`, [visitaId]);
    if (!curr[0]) return res.status(404).json({ error: 'Visita no encontrada' });
    const estadoAnteriorId = curr[0].status_id;

    // Obtener códigos (para decidir real_inicio/real_fin)
    const { rows: estados } = await query(
      `SELECT id, codigo
       FROM catalogo_items
       WHERE id = ANY($1::bigint[])`,
      [[estadoAnteriorId, estado_nuevo_id]]
    );
    const getCodigo = (id) => estados.find(e => e.id === id)?.codigo;
    const codigoNuevo = getCodigo(estado_nuevo_id);

    const setRealInicio = (codigoNuevo === 'en_progreso');
    const setRealFin = (codigoNuevo === 'resuelta' || codigoNuevo === 'cancelada');

    await query('BEGIN');
    try {
      await query(
        `UPDATE visitas
         SET status_id=$1,
             real_inicio = COALESCE(real_inicio, CASE WHEN $2 THEN NOW() ELSE NULL END),
             real_fin = CASE WHEN $3 THEN NOW() ELSE real_fin END
         WHERE id=$4`,
        [estado_nuevo_id, setRealInicio, setRealFin, visitaId]
      );

      await query(
        `INSERT INTO visit_logs (visita_id, autor_id, estado_anterior_id, estado_nuevo_id, nota)
         VALUES ($1,$2,$3,$4,$5)`,
        [visitaId, autor_id, estadoAnteriorId, estado_nuevo_id, nota || null]
      );

      await query('COMMIT');
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }

    res.json({ ok: true });
  } catch (e) { next(e); }
}

/** =========================
 * Observaciones
 * ========================= */
export async function getObservaciones(req, res, next) {
  try {
    const visitaId = Number(req.params.id);
    const vis = req.query.visibilidad;
    const params = [visitaId];
    let whereVis = '';
    if (vis) { params.push(vis); whereVis = `AND o.visibilidad = $2`; }
    const { rows } = await query(
      `SELECT o.id, o.usuario_id, u.nombre_completo AS usuario_nombre,
              o.contenido, o.visibilidad
       FROM visita_observaciones o
       JOIN usuarios u ON u.id = o.usuario_id
       WHERE o.visita_id=$1 ${whereVis}
       ORDER BY o.id ASC`,
      params
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
}

export async function postObservacion(req, res, next) {
  try {
    const visitaId = Number(req.params.id);
    const { usuario_id, contenido, visibilidad } = req.body || {};
    if (!usuario_id) return res.status(400).json({ error: 'usuario_id requerido' });
    if (!contenido) return res.status(400).json({ error: 'contenido requerido' });

    const { rows } = await query(
      `INSERT INTO visita_observaciones (visita_id, usuario_id, contenido, visibilidad)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [visitaId, usuario_id, contenido, visibilidad || 'interno']
    );
    res.status(201).json({ id: rows[0].id });
  } catch (e) { next(e); }
}

/** =========================
 * Evidencias
 * ========================= */
export async function getEvidencias(req, res, next) {
  try {
    const visitaId = Number(req.params.id);
    const { rows } = await query(
      `SELECT id, usuario_id, archivo_url, descripcion
       FROM evidencias WHERE visita_id=$1 ORDER BY id ASC`,
      [visitaId]
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
}

export async function postEvidencia(req, res, next) {
  try {
    const visitaId = Number(req.params.id);
    const { usuario_id, archivo_url, descripcion } = req.body || {};
    if (!usuario_id) return res.status(400).json({ error: 'usuario_id requerido' });
    if (!archivo_url) return res.status(400).json({ error: 'archivo_url requerido' });

    const { rows } = await query(
      `INSERT INTO evidencias (visita_id, usuario_id, archivo_url, descripcion)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [visitaId, usuario_id, archivo_url, descripcion || null]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (e) { next(e); }
}

/** =========================
 * Logs
 * ========================= */
export async function getLogs(req, res, next) {
  try {
    const visitaId = Number(req.params.id);
    const { rows } = await query(
      `SELECT l.id, l.autor_id, u.nombre_completo AS autor_nombre,
              l.estado_anterior_id, sa.etiqueta AS estado_anterior,
              l.estado_nuevo_id, sn.etiqueta AS estado_nuevo,
              l.nota, l.fecha
       FROM visit_logs l
       JOIN usuarios u ON u.id = l.autor_id
       LEFT JOIN catalogo_items sa ON sa.id = l.estado_anterior_id
       LEFT JOIN catalogo_items sn ON sn.id = l.estado_nuevo_id
       WHERE l.visita_id=$1
       ORDER BY l.fecha ASC`,
      [visitaId]
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
}

// PATCH /visitas/:id/tecnico  { tecnico_id?: number|null } | { tecnico_asignado_id?: number|null }
export async function assignTecnico(req, res, next) {
  try {
    const visitaId = Number(req.params.id);
    // admitimos ambas llaves para no romper el front
    const body = req.body || {};
    const tecnicoId = (
      body.tecnico_id !== undefined ? body.tecnico_id : body.tecnico_asignado_id
    );

    // permite desasignar con null/undefined/""
    const tecnicoIdOrNull =
      tecnicoId === null || tecnicoId === undefined || tecnicoId === ""
        ? null
        : Number(tecnicoId);

    // si viene un id, valida que sea técnico activo
    if (tecnicoIdOrNull != null) {
      const v = await query(`
        SELECT 1
        FROM usuarios u
        JOIN roles r ON r.id = u.rol_id
        WHERE u.id = $1::bigint AND u.activo = TRUE AND r.nombre = 'tecnico'
      `, [tecnicoIdOrNull]);

      if (!v.rowCount) {
        return res.status(400).json({ error: 'tecnico_id no es un técnico activo válido' });
      }
    }

    // actualiza
    const { rows } = await query(`
      UPDATE visitas
         SET tecnico_asignado_id = $1::bigint
       WHERE id = $2::bigint
       RETURNING id
    `, [tecnicoIdOrNull, visitaId]);

    if (!rows.length) return res.status(404).json({ error: 'Visita no encontrada' });

    // devuelve la visita con el SELECT normalizado (mismo formato que detalle/lista)
    const selectNorm = buildSelectNormalizado();
    const { rows: full } = await query(`
      SELECT ${selectNorm}
      FROM visitas v
      JOIN clientes c ON c.id = v.cliente_id
      LEFT JOIN ubicaciones u ON u.id = v.ubicacion_id
      LEFT JOIN usuarios tu ON tu.id = v.tecnico_asignado_id
      JOIN usuarios cu ON cu.id = v.creado_por_id
      LEFT JOIN catalogo_items s  ON s.id  = v.status_id
      LEFT JOIN catalogo_items pr ON pr.id = v.priority_id
      LEFT JOIN catalogo_items ty ON ty.id = v.type_id
      WHERE v.id = $1::bigint
    `, [visitaId]);

    res.json(full[0] || { ok: true });
  } catch (e) { next(e); }
}


/** =========================
 * PDF de la visita (ADMIN / SUPERVISOR / TÉCNICO)
 * ========================= */
export async function getPdf(req, res, next) {
  try {
    const id = Number(req.params.id);

    // 1) Depuración inicial: qué viene desde requireAuth
    console.log('serverless hit: GET /api/visitas/' + id + '/pdf');
    console.log('getPdf user debug (antes fallback):', req.user);

    // 2) Fallback: si req.user viene vacío en esta ruta, lo reconstruimos desde el token
    if (!req.user || !req.user.id) {
      try {
        const authHeader = req.headers.authorization || '';
        const rawToken = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : null;

        if (rawToken) {
          // import dinámico para no crear dependencia circular arriba
          const { verifyAccess } = await import('../utils/jwt.js');
          const payload = verifyAccess(rawToken);

          req.user = {
            id:
              payload.id ??
              payload.user_id ??
              payload.uid ??
              payload.sub ??
              null,
            rol:
              payload.rol ??
              payload.role ??
              payload.rol_nombre ??
              payload.role_name ??
              '',
            ...payload,
          };

          console.log('getPdf fallback user (reconstruido del token):', req.user);
        } else {
          console.log('getPdf fallback: no había Authorization Bearer');
        }
      } catch (err) {
        console.error('getPdf fallback error al decodificar token:', err);
      }
    }

    // 3) Ya con req.user final, sacamos rol normalizado
    const rol = String(req.user?.rol || req.user?.rol_nombre || '').toLowerCase();

    console.log('GET /visitas/:id/pdf DEBUG', {
      visitaId: id,
      userId: req.user?.id,
      rol,
    });

    // === AUTORIZACIÓN SEGÚN ROL ===
    if (rol === 'admin') {
      // admin puede ver cualquier visita
    } else if (rol === 'tecnico') {
      // sólo si es el técnico asignado
      const { rows } = await query(
        `SELECT 1
           FROM visitas
          WHERE id = $1
            AND tecnico_asignado_id = $2
          LIMIT 1`,
        [id, req.user.id]
      );
      if (!rows.length) {
        return res.status(403).json({ error: 'No autorizado para esta visita' });
      }
    } else if (rol === 'supervisor') {
      // sólo si la visita pertenece a un técnico de su equipo
      const { rows } = await query(
        `
        SELECT 1
          FROM visitas v
          JOIN tecnicos t ON t.usuario_id = v.tecnico_asignado_id
         WHERE v.id = $1
           AND t.supervisor_id = $2
         LIMIT 1
        `,
        [id, req.user.id]
      );
      if (!rows.length) {
        return res.status(403).json({ error: 'No autorizado para esta visita' });
      }
    } else {
      // cualquier otro rol = prohibido
      return res.status(403).json({ error: 'Rol no autorizado' });
    }

    // === Si pasó la validación, continúa con el PDF ===
    const selectNorm = buildSelectNormalizado();

    // 1) Cabecera principal de la visita
    const { rows } = await query(
      `
      SELECT ${selectNorm}
        FROM visitas v
        JOIN clientes c         ON c.id = v.cliente_id
        LEFT JOIN ubicaciones u ON u.id = v.ubicacion_id
        LEFT JOIN usuarios tu   ON tu.id = v.tecnico_asignado_id
        JOIN usuarios cu        ON cu.id = v.creado_por_id
        LEFT JOIN catalogo_items s  ON s.id  = v.status_id
        LEFT JOIN catalogo_items pr ON pr.id = v.priority_id
        LEFT JOIN catalogo_items ty ON ty.id = v.type_id
       WHERE v.id = $1
      `,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Visita no encontrada' });
    const v = rows[0];

    // 2) Observaciones visibles para cliente
    const { rows: observaciones } = await query(
      `SELECT o.id, o.contenido, o.visibilidad, u.nombre_completo AS autor
         FROM visita_observaciones o
         JOIN usuarios u ON u.id = o.usuario_id
        WHERE o.visibilidad IN ('publico','cliente')
          AND o.visita_id = $1
        ORDER BY o.id ASC`,
      [id]
    );

    // 3) Evidencias
    const { rows: evidencias } = await query(
      `SELECT archivo_url, descripcion
         FROM evidencias
        WHERE visita_id = $1
        ORDER BY id ASC
        LIMIT 6`,
      [id]
    );

    // 4) Headers PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Visita_${id}.pdf"`);

    // 5) Generar PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, left: 40, right: 40, bottom: 40 },
    });
    doc.pipe(res);

    const fmtDate = (d) => {
      if (!d) return '-';
      try {
        return new Date(d).toLocaleString('es-GT', {
          timeZone: 'America/Guatemala',
        });
      } catch {
        return String(d);
      }
    };

    // Encabezado principal
    doc.fontSize(18).text('Reporte de Visita', { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .text(`ID: ${id}`, { align: 'center' })
      .text(
        `Estado: ${v.estado_label ?? v.estado_codigo ?? '-'}`,
        { align: 'center' }
      )
      .text(
        `Programada: ${fmtDate(v.programada_inicio)} — ${fmtDate(v.programada_fin)}`,
        { align: 'center' }
      )
      .text(
        `Ejecutada:  ${fmtDate(v.real_inicio)} — ${fmtDate(v.real_fin)}`,
        { align: 'center' }
      )
      .moveDown();

    // --- CLIENTE ---
    sectionTitle(doc, 'Cliente');
    kv(doc, 'Nombre', v.cliente_nombre);
    kv(doc, 'Creada por', v.creado_por_nombre);
    doc.moveDown(0.3);

    // --- UBICACIÓN ---
    sectionTitle(doc, 'Ubicación');
    kv(doc, 'Etiqueta', v.ubicacion_etiqueta);
    kv(
      doc,
      'Ciudad / Depto',
      `${v.ubicacion_ciudad ?? '-'} / ${v.ubicacion_departamento ?? '-'}`
    );
    doc.moveDown(0.3);

    // --- TÉCNICO ---
    sectionTitle(doc, 'Técnico');
    kv(doc, 'Asignado', v.tecnico_nombre || '-');
    kv(
      doc,
      'Tipo / Prioridad',
      `${v.type_etiqueta ?? '-'} / ${v.priority_etiqueta ?? '-'}`
    );
    doc.moveDown(0.5);

    // --- DESCRIPCIÓN ---
    sectionTitle(doc, 'Descripción');
    paragraph(doc, v.descripcion || '-');
    doc.moveDown(0.3);

    // --- RESULTADO / CIERRE ---
    sectionTitle(doc, 'Resultado / Cierre');
    paragraph(
      doc,
      v.estado_label ? `Estado final: ${v.estado_label}` : '-'
    );
    doc.moveDown(0.5);

    // --- OBSERVACIONES ---
    if (observaciones.length) {
      sectionTitle(doc, 'Observaciones visibles para cliente');
      observaciones.forEach((o) => {
        doc.fontSize(10).text(`• ${o.autor}`);
        paragraph(doc, o.contenido || '');
        doc.moveDown(0.2);
      });
      doc.moveDown(0.5);
    }

    // --- EVIDENCIAS ---
    if (evidencias.length) {
      doc.addPage();
      sectionTitle(doc, 'Evidencias fotográficas');

      const maxW = 240;
      const maxH = 160;
      let x = doc.page.margins.left;
      let y = doc.y;

      for (const ev of evidencias) {
        try {
          const resp = await fetch(ev.archivo_url);
          const buf = Buffer.from(await resp.arrayBuffer());
          doc.image(buf, x, y, {
            fit: [maxW, maxH],
            align: 'center',
            valign: 'center',
          });
          doc
            .fontSize(9)
            .text(ev.descripcion || '', x, y + maxH + 4, { width: maxW });

          if (x === doc.page.margins.left) {
            x += maxW + 20;
          } else {
            x = doc.page.margins.left;
            y += maxH + 40;
          }

          if (y + maxH + 60 > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            x = doc.page.margins.left;
            y = doc.y;
          }
        } catch {
          doc
            .fontSize(10)
            .text(
              `(No se pudo cargar imagen) ${ev.descripcion || ''}`,
              { width: maxW }
            );
          if (x === doc.page.margins.left) {
            x += maxW + 20;
          } else {
            x = doc.page.margins.left;
            y += maxH + 40;
          }
        }
      }
    }

    // --- PIE ---
    doc.moveDown(1);
    doc.fontSize(9).text('Generado por Proyecto Área 3', {
      align: 'center',
    });
    doc.end();
  } catch (e) {
    console.error('Error generando PDF:', e);
    next(e);
  }

  // helpers internos
  function sectionTitle(doc, text) {
    doc.moveDown(0.2);
    doc.fontSize(12).text(text, { underline: true });
  }
  function kv(doc, k, v) {
    doc.fontSize(10).text(`${k}: ${v ?? '-'}`);
  }
  function paragraph(doc, text) {
    doc.fontSize(10).text(text, { align: 'justify' });
  }
}

/** =========================
 *  Helpers para cierre + correo
 * ========================= */

/** Obtiene el id de un ítem de catálogo por código (case-insensitive) */
async function getCatalogIdByCode(grupoCodigo, itemCodigo) {
  const { rows } = await query(`
    SELECT ci.id
    FROM catalogo_items ci
    JOIN catalogo_grupos cg ON cg.id = ci.grupo_id
   WHERE cg.codigo = $1
     AND UPPER(ci.codigo) = UPPER($2)
   LIMIT 1;
  `, [grupoCodigo, itemCodigo]);
  return rows[0]?.id ?? null;
}

/** Id del estado COMPLETADA (error si no existe) */
async function getStatusCompletadaId() {
  const id = await getCatalogIdByCode('VISITA_STATUS', 'COMPLETADA');
  if (!id) throw new Error("No existe el status 'COMPLETADA' en VISITA_STATUS");
  return id;
}

/** =========================
 *  Completar visita + enviar correo
 *  Ruta: POST /api/visitas/:id/completar
 *  Body esperado:
 *  {
 *    resumen?: string,
 *    trabajo_realizado?: string
 *  }
 *  - Horas reales se toman del sistema:
 *    real_inicio = COALESCE(real_inicio, NOW())
 *    real_fin    = NOW()
 * ========================= */
export async function completarYEnviar(req, res, next) {
  const visitaId = Number(req.params.id);
  const { resumen = '', trabajo_realizado = '' } = req.body || {};

  try {
    // 1) Traer visita + cliente + ubicación + técnico (para el correo)
    const { rows: vRows } = await query(`
      SELECT v.id, v.titulo, v.real_inicio, v.real_fin,
             v.cliente_id, v.ubicacion_id, v.tecnico_asignado_id,
             c.nombre AS cliente_nombre, c.correo AS cliente_correo,
             u.etiqueta AS ubicacion_etiqueta, u.direccion_linea1,
             tu.nombre_completo AS tecnico_nombre
        FROM visitas v
        JOIN clientes c          ON c.id = v.cliente_id
        LEFT JOIN ubicaciones u  ON u.id = v.ubicacion_id
        LEFT JOIN usuarios tu    ON tu.id = v.tecnico_asignado_id
       WHERE v.id = $1
       LIMIT 1;
    `, [visitaId]);

    if (!vRows[0]) return res.status(404).json({ ok:false, error:'Visita no encontrada' });

    const visita     = vRows[0];
    const cliente    = { id: visita.cliente_id, nombre: visita.cliente_nombre, correo: visita.cliente_correo };
    const ubicacion  = visita.ubicacion_id ? { etiqueta: visita.ubicacion_etiqueta, direccion_linea1: visita.direccion_linea1 } : null;
    const tecnico    = { id: visita.tecnico_asignado_id, nombre: visita.tecnico_nombre || '-' };

    // 2) Transacción: marcar horas del sistema + estado COMPLETADA + upsert de cierre
    const completadaId = await getStatusCompletadaId();

    await query('BEGIN');

    // Horas reales desde el sistema
    const { rows: tRows } = await query(`
      UPDATE visitas
         SET real_inicio = COALESCE(real_inicio, NOW()),
             real_fin    = NOW(),
             status_id   = $1
       WHERE id = $2
       RETURNING real_inicio, real_fin;
    `, [completadaId, visitaId]);
    const real_inicio = tRows[0].real_inicio;
    const real_fin    = tRows[0].real_fin;

    // Upsert de cierre
    const { rows: cierreRows } = await query(`
      INSERT INTO visita_cierre (visita_id, resumen, trabajo_realizado, hora_inicio, hora_fin, creado_por)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (visita_id)
      DO UPDATE SET resumen = EXCLUDED.resumen,
                    trabajo_realizado = EXCLUDED.trabajo_realizado,
                    hora_inicio = EXCLUDED.hora_inicio,
                    hora_fin    = EXCLUDED.hora_fin
      RETURNING *;
    `, [visitaId, resumen, trabajo_realizado, real_inicio, real_fin, req.user?.id ?? null]);
    const cierre = cierreRows[0];

    await query('COMMIT');

    // 3) Evidencias (si existen)
    const { rows: evids } = await query(
      `SELECT archivo_url, descripcion FROM evidencias WHERE visita_id=$1 ORDER BY id`,
      [visitaId]
    );

    // 4) Email HTML + técnico
    const html = buildVisitaEmail({
      visita:   { id: visita.id, titulo: visita.titulo, real_inicio, real_fin },
      cliente, ubicacion,
      cierre:   { ...cierre, tecnico_nombre: tecnico.nombre },
      materiales: [], // explícitamente vacío
      evidencias: evids
    });

    const to = cliente.correo || process.env.SENDGRID_FROM_EMAIL; // fallback
    const subject = `Reporte de visita #${visita.id} — ${cliente.nombre}`;

    const sent = await enviarCorreoVisita(to, subject, html);

    if (sent.ok) {
      await query(
        `UPDATE visita_cierre SET correo_destino=$1, enviado_email_at=NOW() WHERE visita_id=$2`,
        [to, visitaId]
      );
    }

    return res.json({ ok:true, visitaId, email: sent });
  } catch (err) {
    try { await query('ROLLBACK'); } catch (_) {}
    next(err);
  }
}






