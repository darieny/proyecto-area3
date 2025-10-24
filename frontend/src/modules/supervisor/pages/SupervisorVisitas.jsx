import { useState } from 'react';
import Sidebar from '../../dashboard/components/Sidebar';
import Topbar from '../../dashboard/components/Topbar';
import { useSupervisorVisitas, VISITA_ESTADOS } from '../hooks/useSupervisorVisitas';
import '../../visitas/css/visitas.css';

export default function SupervisorVisitas() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { items, meta, loading, err, descargarPdf } = useSupervisorVisitas({
    page, search, status_codigo: status
  });

  // modal de detalle
  const [selected, setSelected] = useState(null);

  function onSubmit(e) {
    e.preventDefault();
    setPage(1);
  }

  const m = meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className={`shell ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'menu-open' : ''}`}>
      <Sidebar collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      <div className="main">
        <Topbar
          title="Visitas / Reportes (mi equipo)"
          onMenu={() => setMobileOpen(v => !v)}
          onCollapse={() => setCollapsed(v => !v)}
        />

        <div className="card">
          <div className="row between">
            <h2>Historial de visitas</h2>
          </div>

          {/* Filtros */}
          <form onSubmit={onSubmit} className="row gap" style={{ margin: '12px 0' }}>
            <input
              placeholder="Buscar por cliente o título…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
            >
              {VISITA_ESTADOS.map(s => (
                <option key={s.value || 'ALL'} value={s.value}>{s.label}</option>
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
                    {items.map(v => (
                      <tr key={v.id}>
                        <td>{v.id}</td>
                        <td>{v.titulo}</td>
                        <td>{v.cliente}</td>
                        <td>{v.tecnico}</td>
                        <td>{v.programada_inicio ? new Date(v.programada_inicio).toLocaleString() : '—'}</td>
                        <td><span className="chip">{v.status}</span></td>
                        <td className="tright">
                          <button className="btn small" onClick={() => setSelected(v)}>
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!items.length && (
                      <tr>
                        <td colSpan={7} className="muted tright">Sin registros</td>
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
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <button
                  className="btn"
                  disabled={m.page >= m.totalPages}
                  onClick={() => setPage(p => Math.min(m.totalPages, p + 1))}
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
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <h3>Detalle de visita</h3>

            <div className="grid2" style={{ gap: 12 }}>
              <div className="card soft">
                <p><b>ID:</b> {selected.id}</p>
                <p><b>Título:</b> {selected.titulo}</p>
                <p><b>Cliente:</b> {selected.cliente}</p>
                <p><b>Técnico asignado:</b> {selected.tecnico}</p>
              </div>

              <div className="card soft">
                <p><b>Estado:</b> {selected.status}</p>
                <p><b>Inicio programado:</b> {selected.programada_inicio ? new Date(selected.programada_inicio).toLocaleString() : '—'}</p>
                <p><b>Fin programado:</b> {selected.programada_fin ? new Date(selected.programada_fin).toLocaleString() : '—'}</p>
              </div>
            </div>

            <div className="row end gap" style={{ marginTop: 16 }}>
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

