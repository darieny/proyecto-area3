// src/modules/dashboard/pages/DashboardAdmin.jsx
import { useAuth } from '../../../context/AuthContext'; 
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import KpiCard from '../components/KpiCard';
import MiniTrend from '../components/MiniTrend';
import UltimasVisitas from '../components/UltimasVisitas';
import '../css/dashboard.css';

export default function DashboardAdmin() {
  const { user } = useAuth();
  const { summary, latest, loading, err } = useAdminDashboard();

  if (loading) return <div className="skeleton">Cargando dashboard…</div>;
  if (err) return <div className="error">{err}</div>;

  const k = summary?.kpis ?? {};

  return (
    <div className="dash">
      {/* Bienvenida */}
      <header className="dash__greet">
        <h2>¡Hola, {user?.nombre_completo || 'Administrador'}! 🎉</h2>
        <p>Rol: <strong>{user?.rol || '—'}</strong></p>
      </header>

      {/* KPIs principales */}
      <section className="dash__kpis">
        <KpiCard title="Visitas programadas" value={k.programadas} accent="peach" />
        <KpiCard title="Visitas completadas" value={k.completadas} accent="blue" />
        <KpiCard title="Visitas pendientes"  value={k.pendientes}  accent="lilac" />
      </section>

      {/* Estadísticas de mes y semana */}
      <section className="dash__stats">
        <div className="panel">
          <div className="panel__title">Visitas en el mes</div>
          <div className="panel__big">{k.visitasMes}</div>
          <MiniTrend note="+2% Past month" />
        </div>

        <div className="panel">
          <div className="panel__title">Visitas en la semana</div>
          <div className="panel__big">{k.visitasSemana}</div>
          <MiniTrend note="+5% Past month" />
        </div>
      </section>

      {/* Últimas visitas + Eventos */}
      <section className="dash__bottom">
        <UltimasVisitas items={latest} />
        <aside className="side">
          <div className="panel empty">
            <h3>Eventos futuros</h3>
            <p>No tienes eventos futuros</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
