import { useEffect, useState } from 'react';
import { api } from '../../../services/http';

export function useSupervisorDashboard() {
  const [summary, setSummary] = useState({ kpis: {}, trend: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/supervisor/dashboard/summary');
        if (!alive) return;
        setSummary(res.data || { kpis: {}, trend: [] });
      } catch (e) {
        setErr('No se pudo cargar el dashboard');
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { summary, loading, err };
}

