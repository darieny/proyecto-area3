import { query } from '../config/db.js';
import { DateTime } from 'luxon';

const TZ = 'America/Guatemala';

export async function adminSummary(req, res, next) {
  try {
    const from = req.query.from
      ? DateTime.fromISO(req.query.from, { zone: TZ }).startOf('day')
      : DateTime.now().setZone(TZ).startOf('month');
    const to = req.query.to
      ? DateTime.fromISO(req.query.to, { zone: TZ }).endOf('day')
      : DateTime.now().setZone(TZ).endOf('month');

    const weekStart = DateTime.now().setZone(TZ).startOf('week'); // lun-dom

    const { rows: [k] } = await query(
      `
      with rango as (
        select $1::timestamptz as dfrom, $2::timestamptz as dto
      )
      select
        count(*) filter (where v.estado = 'programada' and v.fecha_programada between (select dfrom from rango) and (select dto from rango)) as programadas,
        count(*) filter (where v.estado = 'completada' and v.fecha_programada between (select dfrom from rango) and (select dto from rango)) as completadas,
        count(*) filter (where v.estado = 'pendiente'  and v.fecha_programada between (select dfrom from rango) and (select dto from rango)) as pendientes,
        count(*) filter (where date_trunc('month', v.fecha_programada AT TIME ZONE $3) = date_trunc('month', now() AT TIME ZONE $3)) as visitas_mes,
        count(*) filter (where date_trunc('week',  v.fecha_programada AT TIME ZONE $3) = date_trunc('week',  now() AT TIME ZONE $3)) as visitas_semana
      from visitas v
      `,
      [from.toUTC().toISO(), to.toUTC().toISO(), TZ]
    );

    const { rows: mes } = await query(
      `
      with dias as (
        select generate_series(
          date_trunc('month', now() AT TIME ZONE $1),
          (date_trunc('month', now() AT TIME ZONE $1) + interval '1 month - 1 day'),
          interval '1 day'
        )::date as day
      )
      select d.day::text,
             coalesce(count(v.id), 0)::int as count
      from dias d
      left join visitas v
        on (v.fecha_programada AT TIME ZONE $1)::date = d.day
      group by d.day
      order by d.day;
      `,
      [TZ]
    );

    const { rows: semana } = await query(
      `
      with dias as (
        select generate_series(
          date_trunc('week', now() AT TIME ZONE $1)::date,
          (date_trunc('week', now() AT TIME ZONE $1)::date + 6),
          interval '1 day'
        )::date as day
      )
      select d.day::text,
             coalesce(count(v.id), 0)::int as count
      from dias d
      left join visitas v
        on (v.fecha_programada AT TIME ZONE $1)::date = d.day
      group by d.day
      order by d.day;
      `,
      [TZ]
    );

    res.json({
      kpis: {
        programadas: Number(k.programadas || 0),
        completadas: Number(k.completadas || 0),
        pendientes: Number(k.pendientes || 0),
        visitasMes: Number(k.visitas_mes || 0),
        visitasSemana: Number(k.visitas_semana || 0)
      },
      trends: { mes, semana }
    });
  } catch (e) { next(e); }
}

export async function latestVisits(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit || 3), 20);
    const { rows } = await query(
      `
      select v.id,
             c.nombre as cliente,
             to_char(v.fecha_programada AT TIME ZONE $1, 'YYYY-MM-DD') as fecha,
             to_char(v.fecha_programada AT TIME ZONE $1, 'HH24:MI') as hora,
             v.estado
      from visitas v
      join clientes c on c.id = v.cliente_id
      order by v.fecha_programada desc
      limit $2;
      `,
      ['America/Guatemala', limit]
    );
    res.json(rows);
  } catch (e) { next(e); }
}
