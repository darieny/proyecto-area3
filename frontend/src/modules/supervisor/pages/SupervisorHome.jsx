import { useEffect } from 'react';
import { useSupervisorDashboard } from '../hooks/useSupervisorDashboard';

export default function SupervisorHome() {
  const { kpis, trend, loading, err } = useSupervisorDashboard();

  useEffect(() => {
    console.log('Datos del dashboard:', { kpis, trend });
  }, [kpis, trend]);

  if (loading) return <p>Cargando dashboard...</p>;
  if (err) return <p>Error: {err}</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard Supervisor</h1>
      <p>Total de visitas de tu equipo: {kpis.total}</p>
      <p>Pendientes: {kpis.pendientes}</p>
      <p>En curso: {kpis.en_curso}</p>
      <p>Completadas: {kpis.completadas}</p>
    </div>
  );
}
