import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function useAdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const [s, l] = await Promise.all([
          fetch(`${API}/api/dashboard/admin/summary`, { credentials: 'include' }),
          fetch(`${API}/api/dashboard/admin/latest-visits?limit=3`, { credentials: 'include' })
        ]);
        if (!s.ok || !l.ok) throw new Error('No se pudo cargar el dashboard');
        const dataS = await s.json();
        const dataL = await l.json();
        if (alive) { setSummary(dataS); setLatest(dataL); }
      } catch (e) {
        if (alive) setErr(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  return { summary, latest, loading, err };
}
