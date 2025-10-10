export default function VisitasKpis({ stats = {} }) {
  // stats esperados: { hoy, atrasadas, semanaCompletadas }
  const { hoy = 0, atrasadas = 0, semanaCompletadas = 0 } = stats;
  return (
    <div className="kpis">
      <div className="kpi">
        <div className="kpi-title">Programadas hoy</div>
        <div className="kpi-value">{hoy}</div>
      </div>
      <div className="kpi">
        <div className="kpi-title">Atrasadas</div>
        <div className="kpi-value">{atrasadas}</div>
      </div>
      <div className="kpi">
        <div className="kpi-title">Completadas (semana)</div>
        <div className="kpi-value">{semanaCompletadas}</div>
      </div>
    </div>
  );
}
