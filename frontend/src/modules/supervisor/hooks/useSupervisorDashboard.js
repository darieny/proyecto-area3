import { useEffect, useState } from 'react';
import { api } from '../../../services/http';

export function useSupervisorDashboard() {
  const [kpis, setKpis] = useState({});
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/supervisor/dashboard/summary');
        if (!alive) return;
        setKpis(res.data.kpis);
        setTrend(res.data.trend);
      } catch (e) {
        setErr('No se pudo cargar el dashboard');
      } finally {
        setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  return { kpis, trend, loading, err };
}
