import { useMemo } from "react";

// Mapeo del estado numérico a texto
const STATUS = {
  1: "Programada",
  2: "En progreso",
  3: "Completada",
  4: "Cancelada",
  5: "Pendiente",
};

export default function VisitasTable({
  items,
  meta,
  loading,
  onOpenDetail,
  onPageChange,
  onAssignTecnico, 
}) {
  const rows = useMemo(() => items || [], [items]);

  return (
    <div className="table-card">
      <table className="table">
        <thead>
          <tr>
            <th>Fecha programada</th>
            <th>Cliente</th>
            <th>Título</th>
            <th>Estado</th>
            <th>Técnico</th>
            <th>Observaciones</th>
            <th className="tright">Acciones</th> 
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} className="tcenter">
                Cargando…
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={7} className="tcenter">
                Sin resultados
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((v) => (
              <tr key={v.id}>
                <td>{formatDate(v.programada_inicio)}</td>
                <td>{v.cliente_nombre || `#${v.cliente_id}`}</td>
                <td>{v.titulo || "—"}</td>
                <td>
                  <span
                    className={`tag estado-${(STATUS[v.status_id] || "")
                      .toLowerCase()
                      .replace(/\s/g, "-")}`}
                  >
                    {STATUS[v.status_id] || "—"}
                  </span>
                </td>
                <td>{v.tecnico || v.tecnico_nombre || "Sin asignar"}</td>
                <td className="ellipsis">{v.descripcion || "—"}</td>
                <td className="tright">
                  <button
                    className="btn small"
                    onClick={() => onOpenDetail(v)}
                  >
                    Ver
                  </button>
                  <button
                    className="btn small assign"
                    onClick={() => onAssignTecnico?.(v)}>
                    Asignar
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* paginación */}
      <div className="pagination">
        <button
          className="btn small ghost"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Anterior
        </button>

        <span>
          Página {meta.page} de {meta.totalPages || 1}
        </span>

        <button
          className="btn small ghost"
          disabled={meta.page >= (meta.totalPages || 1)}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

// ======= Helpers =======
function formatDate(s) {
  if (!s) return "-";
  const d = new Date(s);
  return (
    d.toLocaleDateString() +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

