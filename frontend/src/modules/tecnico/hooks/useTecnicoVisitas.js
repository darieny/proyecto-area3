import { useEffect, useState } from 'react';
import { api } from '../../../services/http';

export function useTecnicoVisitas({ from, to } = {}) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const q = new URLSearchParams();
        if (from) q.set('from', from);
        if (to) q.set('to', to);
        const [vis, sum] = await Promise.all([
          api.get(`/tecnico/visitas?${q.toString()}`),
          api.get(`/tecnico/summary?${q.toString()}`),
        ]);
        if (!alive) return;
        setItems(vis.data);
        setSummary(sum.data);
        setErr('');
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.error || 'Error cargando visitas');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [from, to]);

  return { items, summary, loading, err };
}
