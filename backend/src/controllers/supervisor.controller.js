import { query } from '../config/db.js';

// Utilidad: obtener status por defecto VISITA_STATUS
async function getDefaultVisitaStatusId() {
  const { rows } = await query(`
    SELECT ci.id
      FROM catalogo_items ci
      JOIN catalogo_grupos cg ON cg.id = ci.grupo_id
     WHERE cg.codigo = 'VISITA_STATUS'
       AND ci.por_defecto = TRUE
     LIMIT 1;
  `);
  if (!rows[0]) throw new Error('No hay estado por defecto en VISITA_STATUS');
  return rows[0].id;
}

// ===== Dashboard: KPIs + tendencia semanal =====
export async function supSummaryVisitas(req, res) {
  const tecnicos = req.supervisor.tecnicosIds;
  if (!tecnicos.length) {
    return res.json({
      kpis: { total: 0, pendientes: 0, en_curso: 0, completadas: 0 },
      trend: []
    });
  }

  const { rows: kpis } = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE s.codigo = 'PENDIENTE')::int  AS pendientes,
      COUNT(*) FILTER (WHERE s.codigo = 'EN_CURSO')::int   AS en_curso,
      COUNT(*) FILTER (WHERE s.codigo = 'COMPLETADA')::int AS completadas
    FROM visitas v
    JOIN catalogo_items s ON s.id = v.status_id
    JOIN catalogo_grupos g ON g.id = s.grupo_id AND g.codigo = 'VISITA_STATUS'
   WHERE v.tecnico_asignado_id = ANY($1)
  `, [tecnicos]);

  const { rows: trend } = await query(`
    SELECT to_char(date_trunc('week', v.programada_inicio), 'YYYY-MM-DD') AS week,
           COUNT(*)::int AS visitas
      FROM visitas v
     WHERE v.tecnico_asignado_id = ANY($1)
     GROUP BY 1
     ORDER BY 1 DESC
     LIMIT 8;
  `, [tecnicos]);

  res.json({ kpis: kpis[0], trend: trend.reverse() });
}

// ===== Listado de visitas del equipo =====
export async function supListVisitas(req, res) {
  const tecnicos = req.supervisor.tecnicosIds;
  const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize ?? '10', 10)));
  const offset = (page - 1) * pageSize;

  const filtros = [`v.tecnico_asignado_id = ANY($1)`];
  const params = [tecnicos];

  if (req.query.status_codigo) {
    params.push(req.query.status_codigo);
    filtros.push(`s.codigo = $${params.length}`);
  }
  if (req.query.search) {
    params.push(`%${req.query.search}%`);
    filtros.push(`(c.nombre ILIKE $${params.length} OR v.titulo ILIKE $${params.length})`);
  }

  const where = `WHERE ${filtros.join(' AND ')}`;

  const { rows: items } = await query(`
    SELECT
      v.id,
      v.titulo,
      v.programada_inicio,
      v.programada_fin,
      s.etiqueta AS status,
      s.codigo   AS status_codigo,
      u.nombre_completo AS tecnico,
      c.nombre AS cliente
    FROM visitas v
    JOIN usuarios u ON u.id = v.tecnico_asignado_id
    JOIN clientes c ON c.id = v.cliente_id
    JOIN catalogo_items s ON s.id = v.status_id
    JOIN catalogo_grupos g ON g.id = s.grupo_id AND g.codigo = 'VISITA_STATUS'
    ${where}
    ORDER BY v.programada_inicio DESC NULLS LAST, v.id DESC
    OFFSET $${params.length + 1}
    LIMIT  $${params.length + 2};
  `, [...params, offset, pageSize]);

  const { rows: totals } = await query(`
    SELECT COUNT(*)::int AS total
      FROM visitas v
      JOIN usuarios u ON u.id = v.tecnico_asignado_id
      JOIN clientes c ON c.id = v.cliente_id
      JOIN catalogo_items s ON s.id = v.status_id
      JOIN catalogo_grupos g ON g.id = s.grupo_id AND g.codigo = 'VISITA_STATUS'
      ${where};
  `, params);

  res.json({
    items,
    meta: {
      page,
      pageSize,
      total: totals[0].total,
      totalPages: Math.ceil(totals[0].total / pageSize)
    }
  });
}

// ===== Crear / planificar visita para SU equipo =====
export async function supPlanificarVisita(req, res) {
  const { tecnicosIds } = req.supervisor;
  const {
    cliente_id,
    ubicacion_id,      
    tecnico_asignado_id,
    titulo,
    descripcion,
    programada_inicio,
    programada_fin     
  } = req.body;

  // 1) El técnico debe pertenecer a SU equipo
  if (!tecnicosIds.includes(Number(tecnico_asignado_id))) {
    return res.status(403).json({ error: 'No puedes asignar visitas a técnicos fuera de tu equipo' });
    }


  // 2) Status por defecto
  const status_id = await getDefaultVisitaStatusId();

  const { rows } = await query(`
    INSERT INTO visitas (
      cliente_id, ubicacion_id, titulo, descripcion,
      tecnico_asignado_id, creado_por_id, status_id,
      programada_inicio, programada_fin
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING id;
  `, [
    cliente_id ?? null,
    ubicacion_id ?? null,
    titulo,
    descripcion ?? null,
    tecnico_asignado_id,
    req.user.id,
    status_id,
    programada_inicio ?? null,
    programada_fin ?? null
  ]);

  res.status(201).json({ id: rows[0].id });
}

// ===== Listar técnicos del supervisor (para su módulo de usuarios) =====
export async function supListTecnicos(req, res) {
  const tecnicos = req.supervisor.tecnicosIds;
  if (!tecnicos.length) return res.json({ items: [] });

  const { rows } = await query(`
    SELECT
      u.id,
      u.nombre_completo,
      u.correo,
      t.codigo,
      t.especialidades,
      t.zona_cobertura,
      t.disponibilidad,
      t.puntuacion,
      t.activo
    FROM usuarios u
    JOIN tecnicos t ON t.usuario_id = u.id
   WHERE u.id = ANY($1)
   ORDER BY u.nombre_completo ASC;
  `, [tecnicos]);

  res.json({ items: rows });
}
