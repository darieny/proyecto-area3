import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import KpiCard from '../components/KpiCard';
import MiniTrend from '../components/MiniTrend';
import UltimasVisitas from '../components/UltimasVisitas';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CalendarWidget from '../components/CalendarWidget';
import '../css/Dashboard.css';

export default function DashboardAdmin() {
  const { user } = useAuth();
  const { summary, latest, loading, err } = useAdminDashboard();
  const k = summary?.kpis ?? {};

  // NUEVO: estados del menú
  const [collapsed, setCollapsed] = useState(false); // desktop
  const [mobileOpen, setMobileOpen] = useState(false); // móvil

  return (
    <div className={`shell ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'menu-open' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onNavigate={() => setMobileOpen(false)} /* cerrar al navegar en móvil */
      />

      <main className="main">
        <Topbar
          onToggleCollapse={() => setCollapsed(v => !v)}
          onToggleMobile={() => setMobileOpen(v => !v)}
        />

        <div className="dash">
          {loading && <div className="skeleton">Cargando dashboard…</div>}
          {err && !loading && <div className="error">{err}</div>}

          {!loading && !err && (
            <>
              <h2 className="greet">¡Hola, {user?.nombre_completo || 'Administrador'}! 🎉</h2>
            {/**KPIs */}
              <section className="dash__kpis">
                <KpiCard title="Visitas programadas" value={k.programadas} accent="peach" />
                <KpiCard title="Visitas completadas" value={k.completadas} accent="blue" />
                <KpiCard title="Visitas pendientes"  value={k.pendientes}  accent="lilac" />
              </section>

            {/**Estadisticas */}
              <section className="grid2">
                <div className="panel">
                  <div className="panel__title">Visitas en el mes</div>
                  <div className="panel__big">{k.visitasMes}</div>
                  <MiniTrend note="+2% Del mes pasado" />
                </div>

                <div className="panel">
                  <div className="panel__title">Visitas en la semana</div>
                  <div className="panel__big">{k.visitasSemana}</div>
                  <MiniTrend note="+5% Del mes pasado" />
                </div>
              </section>
              {/** Ultimas visitas + Calendario */}
              <section className="dash__bottom">
                <UltimasVisitas items={latest} />
                <CalendarWidget />
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
