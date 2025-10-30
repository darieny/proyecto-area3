import { useEffect, useState } from 'react';
import { api } from '../../../services/http';

export function useSupervisorTecnicos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    try {
      setLoading(true);
      setErr('');
      const { data } = await api.get('/supervisor/tecnicos');
      setItems(data.items || []);
    } catch (e) {
      console.warn('Error cargando técnicos del supervisor:', e?.response?.data || e.message);
      setErr(e?.response?.data?.error || 'No se pudo cargar el equipo de técnicos');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { items, loading, err, reload: load };
}

