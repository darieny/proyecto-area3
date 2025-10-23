import { query } from '../config/db.js';
import PDFDocument from 'pdfkit';

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

/** Selección “normalizada” para lista/detalle (ADMIN) */
function buildSelectNormalizado() {
  return `
    v.id, v.cliente_id, c.nombre AS cliente_nombre,
    v.ubicacion_id, u.etiqueta AS ubicacion_etiqueta, u.ciudad AS ubicacion_ciudad, u.departamento AS ubicacion_departamento,
    v.titulo, v.descripcion,
    v.tecnico_asignado_id, tu.nombre_completo AS tecnico_nombre,
    v.creado_por_id, cu.nombre_completo AS creado_por_nombre,
    v.status_id,
    s.codigo   AS estado_codigo,      -- NUEVO: código textual (PROGRAMADA, EN_RUTA…)
    s.etiqueta AS estado_label,       -- NUEVO: etiqueta legible
    s.etiqueta AS status_etiqueta,    -- (compatibilidad)
    s.color    AS status_color,       -- (compatibilidad)
    v.priority_id, pr.etiqueta AS priority_etiqueta, pr.color AS priority_color,
    v.type_id, ty.etiqueta AS type_etiqueta,
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
    if (filters.estado)    { params.push(filters.estado);    where.push(`s.codigo = $${params.length}`); } // NUEVO
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
        b.priority_id || null,
        b.type_id || null,
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
 * PDF de la visita (ADMIN)
 * GET /visitas/:id/pdf
 * ========================= */
export async function getPdf(req, res, next) {
  try {
    const id = Number(req.params.id);
    const selectNorm = buildSelectNormalizado();

    // 1) Traer cabecera de la visita
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
    const v = rows[0];

    // 2) Datos auxiliares (observaciones públicas y evidencias)
    const { rows: observaciones } = await query(
      `SELECT o.id, o.contenido, o.visibilidad, u.nombre_completo AS autor, o.created_at
         FROM visita_observaciones o
         JOIN usuarios u ON u.id = o.usuario_id
        WHERE o.visibilidad IN ('publico','cliente') AND o.visita_id = $1
        ORDER BY o.id ASC
      `,
      [id]
    );

    const { rows: evidencias } = await query(
      `SELECT archivo_url, descripcion
         FROM evidencias
        WHERE visita_id = $1
        ORDER BY id ASC
        LIMIT 6`,
      [id]
    );

    // 3) Headers de respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Visita_${id}.pdf"`);

    // 4) Crear y streamear PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, left: 40, right: 40, bottom: 40 }
    });
    doc.pipe(res);

    // Helper de fecha (zona GT)
    const fmtDate = (d) => {
      if (!d) return '-';
      try {
        return new Date(d).toLocaleString('es-GT', { timeZone: 'America/Guatemala' });
      } catch { return String(d); }
    };

    // Título
    doc.fontSize(18).text('Reporte de Visita', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10)
      .text(`ID: ${id}`, { align: 'center' })
      .text(`Estado: ${v.estado_label ?? v.estado_codigo ?? '-'}`, { align: 'center' })
      .text(`Programada: ${fmtDate(v.programada_inicio)} — ${fmtDate(v.programada_fin)}`, { align: 'center' })
      .text(`Ejecutada:  ${fmtDate(v.real_inicio)} — ${fmtDate(v.real_fin)}`, { align: 'center' })
      .moveDown();

    // Sección: Cliente
    sectionTitle(doc, 'Cliente');
    kv(doc, 'Nombre', v.cliente_nombre);
    kv(doc, 'Creada por', v.creado_por_nombre);
    doc.moveDown(0.3);

    // Sección: Ubicación
    sectionTitle(doc, 'Ubicación');
    kv(doc, 'Etiqueta', v.ubicacion_etiqueta);
    kv(doc, 'Ciudad / Depto', `${v.ubicacion_ciudad ?? '-'} / ${v.ubicacion_departamento ?? '-'}`);
    doc.moveDown(0.3);

    // Sección: Técnico
    sectionTitle(doc, 'Técnico');
    kv(doc, 'Asignado', v.tecnico_nombre || '-');
    kv(doc, 'Tipo / Prioridad', `${v.type_etiqueta ?? '-'} / ${v.priority_etiqueta ?? '-'}`);
    doc.moveDown(0.5);

    // Descripción y resultado
    sectionTitle(doc, 'Descripción');
    paragraph(doc, v.descripcion || '-');
    doc.moveDown(0.3);

    sectionTitle(doc, 'Resultado / Cierre');
    paragraph(doc, v.estado_label ? `Estado final: ${v.estado_label}` : '-');
    doc.moveDown(0.5);

    // Observaciones públicas
    if (observaciones.length) {
      sectionTitle(doc, 'Observaciones visibles para cliente');
      observaciones.forEach(o => {
        doc.fontSize(10).text(`• ${o.autor} — ${fmtDate(o.created_at)}`);
        paragraph(doc, o.contenido || '');
        doc.moveDown(0.2);
      });
      doc.moveDown(0.5);
    }

    // Evidencias (dos columnas)
    if (evidencias.length) {
      doc.addPage();
      sectionTitle(doc, 'Evidencias fotográficas');

      const maxW = 240; // 2 columnas
      const maxH = 160;
      let x = doc.page.margins.left;
      let y = doc.y;

      for (const ev of evidencias) {
        try {
          // Cargar imagen (URL pública o firmada)
          const resp = await fetch(ev.archivo_url);
          const buf = Buffer.from(await resp.arrayBuffer());
          doc.image(buf, x, y, { fit: [maxW, maxH], align: 'center', valign: 'center' });
          doc.fontSize(9).text(ev.descripcion || '', x, y + maxH + 4, { width: maxW });

          // 2 columnas
          if (x === doc.page.margins.left) {
            x += maxW + 20;
          } else {
            x = doc.page.margins.left;
            y += maxH + 40;
          }

          // Salto si no hay espacio
          if (y + maxH + 60 > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            x = doc.page.margins.left;
            y = doc.y;
          }
        } catch {
          doc.fontSize(10).text(`(No se pudo cargar imagen) ${ev.descripcion || ''}`, { width: maxW });
          // avanzar como si fuera una imagen
          if (x === doc.page.margins.left) x += maxW + 20;
          else { x = doc.page.margins.left; y += maxH + 40; }
        }
      }
    }

    // Pie
    doc.moveDown(1);
    doc.fontSize(9).text('Generado por Proyecto Área 3', { align: 'center' });

    doc.end();
  } catch (e) { next(e); }

  // ==== helpers de formato para el PDF ====
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
