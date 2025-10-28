import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTecnicoVisitas } from '../hooks/useTecnicoVisitas';
import VisitCard from '../components/VisitCard';
import Sidebar from '../../dashboard/components/Sidebar';
import Topbar from '../../dashboard/components/Topbar';
import '../css/Tecnico.css';

export default function TecnicoHome() {
  const {
    items,
    summary,
    loading,
    err,
    from,
    to,
    setFrom,
    setTo,
    reloadToday,
    loadAll,
  } = useTecnicoVisitas();

  const nav = useNavigate();

  const onIniciar = (id) => {
    nav(`/tecnico/visitas/${id}?accion=iniciar`);
  };

  const onCheckIn = (id, geo) => {
    nav(
      `/tecnico/visitas/${id}?accion=checkin` +
        (geo ? `&lat=${geo.lat}&lng=${geo.lng}` : '')
    );
  };

  const onFinalizar = (id, nota) => {
    nav(
      `/tecnico/visitas/${id}?accion=finalizar` +
        (nota ? `&nota=${encodeURIComponent(nota)}` : '')
    );
  };

  // sidebar state
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className={`shell ${collapsed ? 'is-collapsed' : ''} ${
        mobileOpen ? 'menu-open' : ''
      }`}
    >
      <Sidebar
        collapsed={collapsed}
        onNavigate={() => setMobileOpen(false)}
      />

      <main className="main">
        <Topbar
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onToggleMobile={() => setMobileOpen((v) => !v)}
        />

        {/* ====== FILTROS DE FECHA / RESUMEN ====== */}
        <header className="tech-filters-card">
          <div className="tech-filters-left">
            <div className="tech-filter-field">
              <label className="tech-filter-label">Desde</label>
              <div className="tech-date-wrap">
                <input
                  type="date"
                  value={from || ''}
                  onChange={(e) => setFrom(e.target.value)}
                  className="tech-date-input"
                />
                <span className="tech-date-ico">📅</span>
              </div>
            </div>

            <div className="tech-filter-field">
              <label className="tech-filter-label">Hasta</label>
              <div className="tech-date-wrap">
                <input
                  type="date"
                  value={to || ''}
                  onChange={(e) => setTo(e.target.value)}
                  className="tech-date-input"
                />
                <span className="tech-date-ico">📅</span>
              </div>
            </div>

            <button
              type="button"
              onClick={reloadToday}
              className="tech-filter-btn tech-filter-btn--today"
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={loadAll}
              className="tech-filter-btn"
            >
              Ver todo
            </button>
          </div>

          {summary && (
            <div className="tech-filters-summary">
              <span className="summary-chip">
                <b>{summary.programadas ?? 0}</b> prog
              </span>
              <span className="summary-chip">
                <b>{summary.en_ruta ?? 0}</b> en ruta
              </span>
              <span className="summary-chip">
                <b>{summary.en_sitio ?? 0}</b> en sitio
              </span>
              <span className="summary-chip">
                <b>{summary.completadas ?? 0}</b> compl.
              </span>
            </div>
          )}
        </header>


        {/* ====== LOADING / ERROR ====== */}
        {loading && <p className="skeleton">Cargando...</p>}
        {err && !loading && <p className="error">{err}</p>}

        {/* ====== GRID DE VISITAS ====== */}
        <div className="grid grid--cards">
          {items.map((v) => (
            <VisitCard
              key={v.id}
              v={v}
              onIniciar={onIniciar}
              onCheckIn={onCheckIn}
              onFinalizar={onFinalizar}
            />
          ))}

          {!loading && items.length === 0 && (
            <p>No tienes visitas en este rango.</p>
          )}
        </div>
      </main>
    </div>
  );
}

