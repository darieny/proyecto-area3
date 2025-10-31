import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../services/http';
import { visitasApi } from '../../../services/visitas.api';

export function useTecnicoDetalle(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/tecnico/visitas/${id}`); 
      setData(data);
      setErr('');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Error cargando visita');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // cambiarEstado
  async function cambiarEstado(estadoCodigo, payload = {}) {
    await api.patch(`/tecnico/visitas/${id}/estado`, { estado: estadoCodigo, ...payload });
    await load();
  }

  //  subirEvidencia
  async function subirEvidencia({ url, nota }) {
    await api.post(`/tecnico/visitas/${id}/evidencias`, { url, nota });
    await load();
  }

  // COMPLETAR + correo
  async function completar({ resumen = '', trabajo_realizado = '' } = {}) {
    await visitasApi.completar(id, { resumen, trabajo_realizado });
    await load(); // refrescar detalle
  }

  return {
    data, loading, err,
    cambiarEstado,
    subirEvidencia,
    completar,         
    reload: load,
  };
}


