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
        <header
          className="filtros-visitas-tecnico"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div>
            <label
              style={{
                fontSize: 12,
                color: '#475569',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Desde
            </label>
            <input
              type="date"
              value={from || ''}
              onChange={(e) => setFrom(e.target.value)}
              className="input-fecha"
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 14,
                background: '#fff',
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 12,
                color: '#475569',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Hasta
            </label>
            <input
              type="date"
              value={to || ''}
              onChange={(e) => setTo(e.target.value)}
              className="input-fecha"
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 14,
                background: '#fff',
              }}
            />
          </div>

          <button
            type="button"
            onClick={reloadToday}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={loadAll}
            style={{
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Ver todo
          </button>

          {summary && (
            <div
              style={{
                marginLeft: 'auto',
                fontSize: 13,
                color: '#475569',
                lineHeight: 1.4,
              }}
            >
              <b>Resumen:</b>{' '}
              {summary.programadas ?? 0} prog ·{' '}
              {summary.en_ruta ?? 0} en ruta ·{' '}
              {summary.en_sitio ?? 0} en sitio ·{' '}
              {summary.completadas ?? 0} completadas
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

