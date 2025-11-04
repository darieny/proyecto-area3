import { useState } from 'react';
import Sidebar from '../../dashboard/components/Sidebar';
import Topbar from '../../dashboard/components/Topbar';
import KpiCard from '../../dashboard/components/KpiCard';
import MiniTrend from '../../dashboard/components/MiniTrend';
import { useSupervisorDashboard } from '../hooks/useSupervisorDashboard';
import '../../dashboard/css/Dashboard.css';

export default function SupervisorHome() {
  const { summary, loading, err } = useSupervisorDashboard();
  const k = summary?.kpis ?? {};

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <div>Cargando...</div>;
  if (err) return <div>Error: {err}</div>;

  return (
    <div className={`shell ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'menu-open' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onNavigate={() => setMobileOpen(false)}
      />
      <main className="main">
        <Topbar
          onToggleCollapse={() => setCollapsed(v => !v)}  
          onToggleMobile={() => setMobileOpen(v => !v)}    
        />

        <div className="dash">
          <h1 className="dash__title">Dashboard del Supervisor</h1>

          <section className="dash__kpis">
            <KpiCard title="Total de visitas" value={k.total || 0} />
            <KpiCard title="Pendientes" value={k.pendientes || 0} />
            <KpiCard title="En curso" value={k.en_curso || 0} />
            <KpiCard title="Completadas" value={k.completadas || 0} />
          </section>

          <section className="dash__trend">
            <MiniTrend data={summary.trend || []} />
          </section>
        </div>
      </main>
    </div>
  );
}

