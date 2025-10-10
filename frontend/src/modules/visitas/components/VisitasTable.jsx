import { useMemo } from "react";

export default function VisitasTable({ items, meta, loading, onOpenDetail, onPageChange }) {
  const rows = useMemo(() => items || [], [items]);

  return (
    <div className="table-card">
      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Observaciones</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={7} className="tcenter">Cargando…</td></tr>
          )}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={7} className="tcenter">Sin resultados</td></tr>
          )}
          {!loading && rows.map(v => (
            <tr key={v.id}>
              <td>{formatDate(v.fecha || v.created_at)}</td>
              <td>{v.cliente_nombre || v.cliente_id}</td>
              <td className="tag">{v.tipo}</td>
              <td className={`tag prio-${v.prioridad}`}>{v.prioridad}</td>
              <td className={`tag estado-${v.estado}`}>{v.estado}</td>
              <td className="ellipsis">{v.observaciones}</td>
              <td className="tright">
                <button className="btn small" onClick={() => onOpenDetail(v)}>Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button className="btn small ghost" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>Anterior</button>
        <span>Página {meta.page} de {meta.totalPages || 1}</span>
        <button className="btn small ghost" disabled={meta.page >= (meta.totalPages || 1)} onClick={() => onPageChange(meta.page + 1)}>Siguiente</button>
      </div>
    </div>
  );
}

function formatDate(s) {
  if (!s) return "-";
  const d = new Date(s);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
