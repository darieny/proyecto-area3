import { query } from '../config/db.js';

const STATUS_GROUP = 'VISITA_STATUS'; // grupo del catálogo para estados

export async function adminSummary(_req, res, next) {
  try {
    const tz = process.env.TZ || 'America/Guatemala';

    const { rows: [k] } = await query(
      `
      /* Obtenemos los IDs de los estados del grupo VISITA_STATUS */
      with g as (
        select id
        from catalogo_grupos
        where codigo = $1
      ),
      ids as (
        select
          max(ci.id) filter (where ci.codigo = 'PROGRAMADA')  as id_programada,
          max(ci.id) filter (where ci.codigo = 'PENDIENTE')   as id_pendiente,
          max(ci.id) filter (where ci.codigo = 'COMPLETADA')  as id_completada
        from catalogo_items ci
        join g on g.id = ci.grupo_id
      )
      select
        /* Conteos por estado */
        count(*) filter (where v.status_id = (select id_programada from ids)) as programadas,
        count(*) filter (where v.status_id = (select id_completada from ids)) as completadas,
        count(*) filter (where v.status_id = (select id_pendiente  from ids)) as pendientes,

        /* Conteos por mes/semana tomando programada_inicio */
        count(*) filter (
          where date_trunc('month', v.programada_inicio AT TIME ZONE $2)
             = date_trunc('month', now() AT TIME ZONE $2)
        ) as visitas_mes,

        count(*) filter (
          where date_trunc('week', v.programada_inicio AT TIME ZONE $2)
             = date_trunc('week', now() AT TIME ZONE $2)
        ) as visitas_semana
      from visitas v;
      `,
      [STATUS_GROUP, tz]
    );

    res.json({
      kpis: {
        programadas:    Number(k?.programadas    || 0),
        completadas:    Number(k?.completadas    || 0),
        pendientes:     Number(k?.pendientes     || 0),
        visitasMes:     Number(k?.visitas_mes    || 0),
        visitasSemana:  Number(k?.visitas_semana || 0),
      },
      trends: { mes: [], semana: [] } // lo llenaremos más adelante
    });
  } catch (e) {
    next(e);
  }
}

export async function latestVisits(req, res, next) {
  try {
    const tz = process.env.TZ || 'America/Guatemala';
    const limit = Math.min(Number(req.query.limit || 3), 50);

    const { rows } = await query(
      `
      select
        v.id,
        c.nombre as cliente,
        coalesce(ci.etiqueta, ci.codigo) as estado,
        to_char(v.programada_inicio AT TIME ZONE $1, 'YYYY-MM-DD') as fecha,
        to_char(v.programada_inicio AT TIME ZONE $1, 'HH24:MI')     as hora,
        v.titulo
      from visitas v
      join clientes c       on c.id = v.cliente_id
      left join catalogo_items ci on ci.id = v.status_id
      order by v.programada_inicio desc nulls last, v.id desc
      limit $2;
      `,
      [tz, limit]
    );

    res.json(rows);
  } catch (e) {
    next(e);
  }
}

