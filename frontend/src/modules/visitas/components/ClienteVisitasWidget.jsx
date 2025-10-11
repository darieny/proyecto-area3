const STATUS = { 1:"Programada", 2:"En progreso", 3:"Completada", 4:"Cancelada", 5:"Pendiente" };

export default function ClienteVisitasWidget({ items = [], loading, onVerTodas }) {
  return (
    <section className="cliente__section">
      <div className="dato__label" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>Últimas visitas</span>
        <button className="btn-light" onClick={onVerTodas}>Ver todas</button>
      </div>

      <div className="box">
        {loading ? "Cargando…" :
          items.length === 0 ? "Sin visitas todavía." :
          <ul className="list clean">
            {items.map(v => (
              <li key={v.id} style={{display:"flex",justifyContent:"space-between",gap:8}}>
                <div>
                  <b>{v.titulo || "Visita"}</b>
                  <div className="muted">
                    {(v.cliente_nombre || "")}
                    {v.programada_inicio && " • " + new Date(v.programada_inicio).toLocaleString()}
                  </div>
                </div>
                <span className="chip">{STATUS[v.status_id] || "—"}</span>
              </li>
            ))}
          </ul>
        }
      </div>
    </section>
  );
}
