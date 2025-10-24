import { useEffect, useState } from 'react';
import { api } from '../../../services/http';

export function useSupervisorTecnicos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    try {
      setLoading(true);
      const r = await api.get('/supervisor/tecnicos');
      setItems(r.data.items || []);
    } catch (e) {
      setErr(e?.response?.data?.error || 'No se pudo cargar el equipo');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { items, loading, err, reload: load };
}
