import { useState } from "react";
import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";
import {
  useSupervisorVisitas,
  VISITA_ESTADOS,
} from "../hooks/useSupervisorVisitas";
import "../../visitas/css/visitas.css";

export default function SupervisorVisitas() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { items, meta, loading, err, descargarPdf } = useSupervisorVisitas({
    page,
    search,
    status_codigo: status,
  });

  // modal de detalle
  const [selected, setSelected] = useState(null);

  function onSubmit(e) {
    e.preventDefault();
    setPage(1);
  }

  const m = meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div
      className={`shell ${collapsed ? "is-collapsed" : ""} ${
        mobileOpen ? "menu-open" : ""
      }`}
    >
      <Sidebar collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      <div className="main">
        <Topbar
          title="Visitas / Reportes (mi equipo)"
          onToggleCollapse={() => setCollapsed(v => !v)}  
          onToggleMobile={() => setMobileOpen(v => !v)}    
        />

        <div className="card">
          <div className="row between">
            <h2>Historial de visitas</h2>
          </div>

          {/* Filtros */}
          <form
            onSubmit={onSubmit}
            className="row gap"
            style={{ margin: "12px 0" }}
          >
            <input
              placeholder="Buscar por cliente o título…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {VISITA_ESTADOS.map((s) => (
                <option key={s.value || "ALL"} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button className="btn">Aplicar</button>
          </form>

          {loading && <div className="muted">Cargando…</div>}
          {err && <div className="error">{err}</div>}

          {!loading && !err && (
            <>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Título</th>
                      <th>Cliente</th>
                      <th>Técnico</th>
                      <th>Programada</th>
                      <th>Estado</th>
                      <th className="tright">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((v) => {
                      const estadoCode = (v.status || "")
                        .toString()
                        .toUpperCase()
                        .replace(/\s+/g, "_"); // espacios -> guion_bajo

                      return (
                        <tr key={v.id}>
                          <td>{v.id}</td>
                          <td>{v.titulo}</td>
                          <td>{v.cliente}</td>
                          <td>{v.tecnico}</td>
                          <td>
                            {v.programada_inicio
                              ? new Date(v.programada_inicio).toLocaleString()
                              : "—"}
                          </td>

                          {/* === Estado con badge pastel reutilizando las clases globales === */}
                          <td>
                            <span
                              className={`estado-badge estado--${estadoCode}`}
                            >
                              {v.status || "—"}
                            </span>
                          </td>

                          <td className="tright">
                            <button
                              className="btn-chip"
                              onClick={() => setSelected(v)}
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!items.length && (
                      <tr>
                        <td colSpan={7} className="muted tright">
                          Sin registros
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* paginación */}
              <div className="row end gap" style={{ marginTop: 12 }}>
                <span className="muted">
                  Página {m.page} de {m.totalPages} — {m.total} resultados
                </span>
                <button
                  className="btn"
                  disabled={m.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <button
                  className="btn"
                  disabled={m.page >= m.totalPages}
                  onClick={() => setPage((p) => Math.min(m.totalPages, p + 1))}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== Modal Detalle de Visita (solo lectura + PDF) ===== */}
      {selected && (
        <div className="modal__backdrop" onClick={() => setSelected(null)}>
          <div
            className="modal modal--sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="mhead">
              <div className="mhead__title">
                <h3>Detalle de visita</h3>
                <span
                  className={`estado-badge estado--${String(
                    selected.status || ""
                  )
                    .toUpperCase()
                    .replace(/\s+/g, "_")}`}
                  title="Estado actual"
                >
                  {selected.status || "—"}
                </span>
              </div>
              <button
                className="btn-icon"
                onClick={() => setSelected(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="mbody">
              <div className="grid2 gap16">
                <div className="card soft">
                  <dl className="kv">
                    <div className="kv__row">
                      <dt>ID</dt>
                      <dd>#{selected.id}</dd>
                    </div>
                    <div className="kv__row">
                      <dt>Título</dt>
                      <dd>{selected.titulo}</dd>
                    </div>
                    <div className="kv__row">
                      <dt>Cliente</dt>
                      <dd>{selected.cliente}</dd>
                    </div>
                    <div className="kv__row">
                      <dt>Técnico</dt>
                      <dd>{selected.tecnico || "—"}</dd>
                    </div>
                    {/* Estos tres solo se muestran si vienen del API */}
                    {selected.type_etiqueta && (
                      <div className="kv__row">
                        <dt>Tipo</dt>
                        <dd>
                          <span className="chip">{selected.type_etiqueta}</span>
                        </dd>
                      </div>
                    )}
                    {selected.priority_etiqueta && (
                      <div className="kv__row">
                        <dt>Prioridad</dt>
                        <dd>
                          <span className="chip">
                            {selected.priority_etiqueta}
                          </span>
                        </dd>
                      </div>
                    )}
                    {(selected.ubicacion_etiqueta ||
                      selected.ubicacion_ciudad ||
                      selected.ubicacion_departamento) && (
                      <div className="kv__row">
                        <dt>Ubicación</dt>
                        <dd>
                          {selected.ubicacion_etiqueta
                            ? `${selected.ubicacion_etiqueta} • `
                            : ""}
                          {[
                            selected.ubicacion_ciudad,
                            selected.ubicacion_departamento,
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="card soft">
                  <dl className="kv">
                    <div className="kv__row">
                      <dt>Inicio programado</dt>
                      <dd>
                        {selected.programada_inicio
                          ? new Date(
                              selected.programada_inicio
                            ).toLocaleString()
                          : "—"}
                      </dd>
                    </div>
                    <div className="kv__row">
                      <dt>Fin programado</dt>
                      <dd>
                        {selected.programada_fin
                          ? new Date(selected.programada_fin).toLocaleString()
                          : "—"}
                      </dd>
                    </div>
                    {/* tiempos reales si existen */}
                    {selected.real_inicio && (
                      <div className="kv__row">
                        <dt>Inicio real</dt>
                        <dd>
                          {new Date(selected.real_inicio).toLocaleString()}
                        </dd>
                      </div>
                    )}
                    {selected.real_fin && (
                      <div className="kv__row">
                        <dt>Fin real</dt>
                        <dd>{new Date(selected.real_fin).toLocaleString()}</dd>
                      </div>
                    )}
                  </dl>

                  {/* Nota “estado actual” en texto discreto */}
                  <div className="muted sm" style={{ marginTop: 8 }}>
                    Actual: {selected.status || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mfoot">
              <button className="btn" onClick={() => setSelected(null)}>
                Cerrar
              </button>
              <button
                className="btn primary"
                onClick={() => descargarPdf(selected.id)}
              >
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
