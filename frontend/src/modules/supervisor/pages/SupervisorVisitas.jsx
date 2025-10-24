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

  const { items, meta, loading, err } = useSupervisorVisitas({
    page, search, status_codigo: status
  });

  function onSubmit(e) {
    e.preventDefault();
    setPage(1);
  }

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
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
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
                        <td>
                          <span className="chip">{v.status}</span>
                        </td>
                      </tr>
                    ))}
                    {!items.length && (
                      <tr>
                        <td colSpan={6} className="muted tright">Sin registros</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* paginación */}
              <div className="row end gap" style={{ marginTop: 12 }}>
                <span className="muted">
                  Página {meta.page} de {meta.totalPages} — {meta.total} resultados
                </span>
                <button
                  className="btn"
                  disabled={meta.page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <button
                  className="btn"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
