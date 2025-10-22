// src/controllers/tecnico.controller.js
import { query } from '../config/db.js';

/* =========================
   Utils
========================= */

// Distancia Haversine (metros)
function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}

// Constantes de catálogo/flujo
const STATUS_GROUP = 'VISITA_STATUS';
const FLOW = ['PROGRAMADA', 'EN_RUTA', 'EN_SITIO', 'COMPLETADA'];
const CANCEL = 'CANCELADA';

// Helpers de catálogo
async function getGrupoId(codigo) {
  const { rows } = await query('SELECT id FROM catalogo_grupos WHERE codigo = $1', [codigo]);
  return rows[0]?.id || null;
}
async function getEstadoIdPorCodigo(codigo) {
  const gid = await getGrupoId(STATUS_GROUP);
  const { rows } = await query(
    'SELECT id FROM catalogo_items WHERE grupo_id = $1 AND codigo = $2',
    [gid, codigo]
  );
  return rows[0]?.id || null;
}

/* =========================
   Controladores
========================= */

export async function listMisVisitas(req, res) {
  try {
    const tecnicoUserId = req.user.id; // BIGINT
    const { from, to } = req.query;

    const where = ['v.tecnico_asignado_id = $1'];
    const params = [tecnicoUserId];

    if (from) { params.push(from); where.push(`v.programada_inicio >= $${params.length}`); }
    if (to)   { params.push(to);   where.push(`v.programada_inicio < ($${params.length}::date + INTERVAL '1 day')`); }

    const sql = `
      SELECT
        v.id,
        v.titulo,
        v.descripcion,
        v.programada_inicio,
        v.programada_fin,
        v.real_inicio,
        v.real_fin,
        v.status_id,
        ps.codigo   AS status_codigo,
        ps.etiqueta AS status_etiqueta,
        pprio.etiqueta AS prioridad,
        c.nombre   AS cliente,
        u.latitud  AS latitud,
        u.longitud AS longitud,
        (COALESCE(u.direccion_linea1,'') || ' ' || COALESCE(u.direccion_linea2,'')) AS direccion
      FROM visitas v
      JOIN clientes c         ON c.id = v.cliente_id
      LEFT JOIN ubicaciones u ON u.id = v.ubicacion_id
      LEFT JOIN catalogo_items ps    ON ps.id = v.status_id
      LEFT JOIN catalogo_items pprio ON pprio.id = v.priority_id
      WHERE ${where.join(' AND ')}
      ORDER BY v.programada_inicio ASC NULLS LAST, v.id DESC
    `;
    const { rows } = await query(sql, params);

    const out = rows.map(r => ({
      id: r.id,
      cliente: r.cliente,
      titulo: r.titulo,
      descripcion: r.descripcion,
      fecha: r.programada_inicio || r.real_inicio,
      prioridad: r.prioridad,
      estado: r.status_codigo,         // PROGRAMADA | EN_RUTA | EN_SITIO | COMPLETADA | CANCELADA
      estado_label: r.status_etiqueta,
      lat: r.latitud,
      lng: r.longitud,
      direccion: (r.direccion || '').trim()
    }));

    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error listando visitas del técnico' });
  }
}

export async function getVisitaDetalle(req, res) {
  try {
    const tecnicoUserId = req.user.id;
    const { id } = req.params;

    const { rows } = await query(`
      SELECT
        v.*,
        c.nombre AS cliente,
        u.latitud, u.longitud,
        (COALESCE(u.direccion_linea1,'') || ' ' || COALESCE(u.direccion_linea2,'')) AS direccion,
        ps.codigo AS estado_codigo,
        ps.etiqueta AS estado_label
      FROM visitas v
      JOIN clientes c         ON c.id = v.cliente_id
      LEFT JOIN ubicaciones u ON u.id = v.ubicacion_id
      LEFT JOIN catalogo_items ps ON ps.id = v.status_id
      WHERE v.id = $1
    `, [id]);

    const v = rows[0];
    if (!v) return res.status(404).json({ error: 'Visita no existe' });
    if (String(v.tecnico_asignado_id) !== String(tecnicoUserId)) {
      return res.status(403).json({ error: 'No autorizada' });
    }

    // Timeline (visit_logs)
    const { rows: eventos } = await query(`
      SELECT l.id,
             pa.codigo AS estado_anterior,
             pn.codigo AS estado_nuevo,
             l.nota,
             l.fecha
      FROM visit_logs l
      LEFT JOIN catalogo_items pa ON pa.id = l.estado_anterior_id
      LEFT JOIN catalogo_items pn ON pn.id = l.estado_nuevo_id
      WHERE l.visita_id = $1
      ORDER BY l.fecha ASC
    `, [id]);

    // Evidencias (orden por id)
    const { rows: evidencias } = await query(`
      SELECT id, archivo_url AS url, descripcion
      FROM evidencias
      WHERE visita_id = $1
      ORDER BY id ASC
    `, [id]);

    res.json({
      id: v.id,
      cliente: v.cliente,
      titulo: v.titulo,
      descripcion: v.descripcion,
      fecha: v.programada_inicio || v.real_inicio,
      prioridad_id: v.priority_id,
      estado: v.estado_codigo,
      estado_label: v.estado_label,
      lat: v.latitud,
      lng: v.longitud,
      direccion: (v.direccion || '').trim(),
      eventos: eventos.map(e => ({
        id: e.id,
        estado_anterior: e.estado_anterior,
        estado_nuevo: e.estado_nuevo,
        nota: e.nota,
        created_at: e.fecha
      })),
      evidencias: evidencias.map(ev => ({
        id: ev.id,
        url: ev.url,
        nota: ev.descripcion
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error obteniendo detalle de visita' });
  }
}

export async function postEventoVisita(req, res) {
  try {
    const tecnicoUserId = req.user.id;
    const { id } = req.params;
    const { nuevo_estado_codigo, nota, geo } = req.body; // 'EN_RUTA' | 'EN_SITIO' | 'COMPLETADA' | 'CANCELADA'

    const estadoNuevoId = await getEstadoIdPorCodigo(nuevo_estado_codigo);
    if (!estadoNuevoId) return res.status(422).json({ error: 'Estado no válido' });

    // Cargar visita (estado actual + destino)
    const { rows } = await query(`
      SELECT v.id, v.cliente_id, v.tecnico_asignado_id, v.status_id,
             v.titulo, v.descripcion, v.real_inicio, v.real_fin,
             u.latitud, u.longitud
      FROM visitas v
      LEFT JOIN ubicaciones u ON u.id = v.ubicacion_id
      WHERE v.id = $1
    `, [id]);
    const v = rows[0];
    if (!v) return res.status(404).json({ error: 'Visita no existe' });
    if (String(v.tecnico_asignado_id) !== String(tecnicoUserId)) {
      return res.status(403).json({ error: 'No autorizada' });
    }

    // Validar secuencia (CANCELADA libre)
    if (nuevo_estado_codigo !== CANCEL) {
      const { rows: rAct } = await query('SELECT codigo FROM catalogo_items WHERE id = $1', [v.status_id]);
      const actualCodigo = rAct[0]?.codigo;
      const iA = FLOW.indexOf(actualCodigo);
      const iN = FLOW.indexOf(nuevo_estado_codigo);
      if (iA === -1 || iN !== iA + 1) {
        return res.status(422).json({ error: 'Secuencia de estados inválida' });
      }
    }

    // Geocheck al pasar a EN_SITIO (si hay geo de destino y del técnico)
    if (
      nuevo_estado_codigo === 'EN_SITIO' &&
      v.latitud != null && v.longitud != null &&
      geo?.lat && geo?.lng
    ) {
      const dist = haversineMeters(
        { lat: Number(geo.lat), lng: Number(geo.lng) },
        { lat: Number(v.latitud), lng: Number(v.longitud) }
      );
      if (dist > 200) {
        return res.status(422).json({ error: 'Fuera de rango para check-in (>200m)' });
      }
    }

    // Actualizaciones de tiempo real
    const sets = ['status_id = $1'];
    const params = [estadoNuevoId, id];

    if (nuevo_estado_codigo === 'EN_RUTA' && !v.real_inicio) {
      sets.push('real_inicio = NOW()');
    }

    if (nuevo_estado_codigo === 'COMPLETADA') {
      // Nota obligatoria
      if (!nota || String(nota).trim() === '') {
        return res.status(422).json({ error: 'No puedes finalizar sin una nota de cierre.' });
      }
      sets.push('real_fin = NOW()');
    }

    // Transacción
    await query('BEGIN');
    await query(
      `INSERT INTO visit_logs (visita_id, autor_id, estado_anterior_id, estado_nuevo_id, nota)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, tecnicoUserId, v.status_id, estadoNuevoId, nota || null]
    );
    await query(`UPDATE visitas SET ${sets.join(', ')} WHERE id = $2`, params);
    await query('COMMIT');

    // Respuesta: estado y timeline actualizado
    const { rows: estadoRow } = await query('SELECT codigo FROM catalogo_items WHERE id=$1', [estadoNuevoId]);
    const { rows: eventos } = await query(`
      SELECT l.id, pa.codigo AS estado_anterior, pn.codigo AS estado_nuevo, l.nota, l.fecha
      FROM visit_logs l
      LEFT JOIN catalogo_items pa ON pa.id = l.estado_anterior_id
      LEFT JOIN catalogo_items pn ON pn.id = l.estado_nuevo_id
      WHERE l.visita_id = $1
      ORDER BY l.fecha ASC
    `, [id]);

    // -------- Envío de correo al completar --------
    if (nuevo_estado_codigo === 'COMPLETADA') {
      try {
        // Traer datos del cliente y del técnico para el correo
        const { rows: info } = await query(`
          SELECT c.correo        AS cliente_correo,
                 c.nombre        AS cliente_nombre,
                 v.titulo,
                 v.descripcion,
                 v.real_fin,
                 tu.nombre_completo AS tecnico_nombre
          FROM visitas v
          JOIN clientes c ON c.id = v.cliente_id
          LEFT JOIN usuarios tu ON tu.id = v.tecnico_asignado_id
          WHERE v.id = $1
        `, [id]);

        const cli = info[0];
        if (cli?.cliente_correo) {
          const { sendMail } = await import('../utils/mailer.js');

          const asunto = `Reporte de visita completada: ${cli.titulo}`;
          const cuerpoHTML = `
            <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:auto">
              <h2 style="margin-bottom:8px">Visita completada </h2>
              <p>Hola <b>${cli.cliente_nombre}</b>,</p>
              <p>La visita <b>"${cli.titulo}"</b> fue marcada como <b>COMPLETADA</b>.</p>
              <ul>
                <li><b>Técnico:</b> ${cli.tecnico_nombre || '—'}</li>
                <li><b>Fecha de cierre:</b> ${cli.real_fin ? new Date(cli.real_fin).toLocaleString() : '—'}</li>
              </ul>
              <p><b>Nota de cierre:</b><br/>${nota ? String(nota).replace(/\n/g,'<br/>') : '(sin nota)'}</p>
              ${cli.descripcion ? `<p><b>Descripción:</b><br/>${String(cli.descripcion).replace(/\n/g,'<br/>')}</p>` : ''}
              <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
              <p style="color:#666">Gracias por confiar en nosotros.<br/>Equipo de Proyecto Área 3</p>
            </div>
          `;

          await sendMail({
            to: cli.cliente_correo,
            subject: asunto,
            html: cuerpoHTML,
          });
        } else {
          console.log('Cliente sin correo; se omite el envío.');
        }
      } catch (mailErr) {
        console.error('Error al enviar correo de visita completada:', mailErr.message);
      }
    }
    // ---------------------------------------------

    res.json({ ok: true, estado: estadoRow[0]?.codigo, eventos });
  } catch (e) {
    await query('ROLLBACK').catch(() => {});
    console.error(e);
    res.status(500).json({ error: 'Error registrando evento de visita' });
  }
}

export async function postEvidenciaVisita(req, res) {
  try {
    const tecnicoUserId = req.user.id;
    const { id } = req.params;
    const { url, nota } = req.body;
    if (!url) return res.status(422).json({ error: 'Falta url' });

    const { rows } = await query('SELECT tecnico_asignado_id FROM visitas WHERE id = $1', [id]);
    const v = rows[0];
    if (!v) return res.status(404).json({ error: 'Visita no existe' });
    if (String(v.tecnico_asignado_id) !== String(tecnicoUserId)) {
      return res.status(403).json({ error: 'No autorizada' });
    }

    await query(
      `INSERT INTO evidencias (visita_id, usuario_id, archivo_url, descripcion)
       VALUES ($1, $2, $3, $4)`,
      [id, tecnicoUserId, url, nota || null]
    );

    const { rows: evidencias } = await query(
      `SELECT id, archivo_url AS url, descripcion AS nota
       FROM evidencias
       WHERE visita_id = $1
       ORDER BY id ASC`,
      [id]
    );

    res.json({ ok: true, evidencias });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error subiendo evidencia' });
  }
}

export async function getTecnicoSummary(req, res) {
  try {
    const tecnicoUserId = req.user.id;
    const { from, to } = req.query;

    const where = ['v.tecnico_asignado_id = $1'];
    const params = [tecnicoUserId];

    if (from) { params.push(from); where.push(`v.programada_inicio >= $${params.length}`); }
    if (to)   { params.push(to);   where.push(`v.programada_inicio < ($${params.length}::date + INTERVAL '1 day')`); }

    const gid = await getGrupoId(STATUS_GROUP);

    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE s.codigo = 'PROGRAMADA') AS programadas,
        COUNT(*) FILTER (WHERE s.codigo = 'EN_RUTA')    AS en_ruta,
        COUNT(*) FILTER (WHERE s.codigo = 'EN_SITIO')   AS en_sitio,
        COUNT(*) FILTER (WHERE s.codigo = 'COMPLETADA') AS completadas
      FROM visitas v
      JOIN catalogo_items s ON s.id = v.status_id AND s.grupo_id = $${params.length + 1}
      WHERE ${where.join(' AND ')}
    `;
    const { rows } = await query(sql, [...params, gid]);
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error en summary' });
  }
}


