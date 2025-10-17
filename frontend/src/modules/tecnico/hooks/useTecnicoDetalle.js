import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/http';

export function useTecnicoDetalle(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tecnico/visitas/${id}`);
      setData(res.data);
      setErr('');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Error cargando visita');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const cambiarEstado = useCallback(async (nuevo_estado_codigo, { nota, geo } = {}) => {
    const res = await api.post(`/tecnico/visitas/${id}/eventos`, { nuevo_estado_codigo, nota, geo });
    setData(prev => prev ? { ...prev, estado: res.data.estado, eventos: res.data.eventos } : prev);
    return res.data;
  }, [id]);

  const subirEvidencia = useCallback(async ({ url, nota }) => {
    const res = await api.post(`/tecnico/visitas/${id}/evidencias`, { url, nota });
    setData(prev => prev ? { ...prev, evidencias: res.data.evidencias } : prev);
    return res.data;
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, err, refresh, cambiarEstado, subirEvidencia };
}
