export default function ClienteKpis({ kpis }) {
  if (!kpis) return null;
  return (
    <div className="clientes__kpis">
      <KpiCard title="Total Clientes" value={kpis.total} trend="+16% este mes" trendType="up" />
      <KpiCard title="Clientes nuevos" value={kpis.nuevos_mes} trend="−1% this month" trendType="down" />
      <KpiCard title="Clientes sin visitas" value={kpis.sin_visitas} />
    </div>
  );
}

function KpiCard({ title, value, trend, trendType }) {
  return (
    <div className="kpi">
      <div className="kpi__label">{title}</div>
      <div className="kpi__value">{value}</div>
      {trend && <div className={`kpi__trend ${trendType === 'down' ? 'down' : 'up'}`}>{trend}</div>}
    </div>
  );
}
