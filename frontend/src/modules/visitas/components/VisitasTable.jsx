import { useMemo } from "react";
import '../css/visitas.css';

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
            <th>Descripción</th>
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
            rows.map((v) => {
              // Normalizamos el código del estado, ej:
              // "Programada" -> "PROGRAMADA"
              // "En ruta" -> "EN_RUTA"
              const estadoCode = (
                v.estado_codigo ||
                v.estado_label ||
                v.status_etiqueta ||
                ""
              )
                .toString()
                .toUpperCase()
                .replace(/\s+/g, "_");

              const estadoLabel =
                v.estado_label || v.status_etiqueta || v.estado_codigo || "—";

              return (
                <tr key={v.id}>
                  <td>{formatDate(v.programada_inicio)}</td>

                  <td>{v.cliente_nombre || `#${v.cliente_id}`}</td>

                  <td>{v.titulo || "—"}</td>

                  {/* === Estado visual con badge pastel === */}
                  <td>
                    <span className={`estado-badge estado--${estadoCode}`}>
                      {estadoLabel}
                    </span>
                  </td>

                  <td>{v.tecnico_nombre || "Sin asignar"}</td>

                  <td className="ellipsis">{v.descripcion || "—"}</td>

                  <td className="tright acciones-cell">
                    <button
                      className="btn-chip"
                      onClick={() => onOpenDetail(v)}
                    >
                      Ver
                    </button>

                    <button
                      className="btn-chip soft-blue"
                      onClick={() => onAssignTecnico?.(v)}
                    >
                      Asignar
                    </button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {/* Paginación */}
      <div className="pagination">
        <button
          className="btn small ghost"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Anterior
        </button>

        <span>
          Página {meta.page} de{" "}
          {meta.totalPages || Math.ceil(meta.total / meta.pageSize) || 1}
        </span>

        <button
          className="btn small ghost"
          disabled={
            meta.page >=
            (meta.totalPages || Math.ceil(meta.total / meta.pageSize) || 1)
          }
          onClick={() => onPageChange(meta.page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

/* ===== Helpers ===== */
function formatDate(s) {
  if (!s) return "-";
  const d = new Date(s);
  return (
    d.toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}
