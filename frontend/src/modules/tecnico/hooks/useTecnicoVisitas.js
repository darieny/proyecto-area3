import { useEffect, useState } from 'react';
import { api } from '../../../services/http';

function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useTecnicoVisitas() {
  // Por defecto: hoy
  const today = fmt(new Date());

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Cargar cuando cambie el rango
  useEffect(() => {
    let cancelled = false;

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

        if (cancelled) return;

        setItems(vis.data);
        setSummary(sum.data);
        setErr('');
      } catch (e) {
        if (cancelled) return;
        setErr(e?.response?.data?.error || 'Error cargando visitas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [from, to]);

  // Helper para ver TODO (sin filtro de fechas)
  async function loadAll() {
    try {
      setLoading(true);
      const [vis, sum] = await Promise.all([
        api.get('/tecnico/visitas'),
        api.get('/tecnico/summary'),
      ]);
      setItems(vis.data);
      setSummary(sum.data);
      setErr('');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Error cargando visitas');
    } finally {
      setLoading(false);
    }
  }

  return {
    items,
    summary,
    loading,
    err,
    from,
    to,
    setFrom,
    setTo,
    reloadToday: () => {
      const t = fmt(new Date());
      setFrom(t);
      setTo(t);
    },
    loadAll,
  };
}


