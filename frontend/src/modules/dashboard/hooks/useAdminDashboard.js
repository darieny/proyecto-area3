import { useEffect, useState } from 'react';
import { api } from '../../../services/http';

export function useAdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [latest, setLatest]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [s, l] = await Promise.all([
          api.get('/api/dashboard/admin/summary'),
          api.get('/api/dashboard/admin/ultimas-visitas', { params: { limit: 3 } }),
        ]);
        if (alive) {
          setSummary(s.data);
          setLatest(l.data);
        }
      } catch (e) {
        if (alive) setErr('No se pudo cargar el dashboard');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { summary, latest, loading, err };
}

