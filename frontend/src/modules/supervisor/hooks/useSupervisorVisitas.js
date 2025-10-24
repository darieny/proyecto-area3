import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../services/http';

const PAGE_SIZE = 10;


export const VISITA_ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_CURSO',  label: 'En curso' },
  { value: 'COMPLETADA',label: 'Completada' },
];

export function useSupervisorVisitas({ page=1, search='', status_codigo='' } = {}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const qp = useMemo(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('pageSize', String(PAGE_SIZE));
    if (search?.trim()) p.set('search', search.trim());
    if (status_codigo) p.set('status_codigo', status_codigo);
    return p.toString();
  }, [page, search, status_codigo]);

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get(`/supervisor/visitas?${qp}`);
      setItems(data.items || []);
      setMeta(data.meta || { total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1 });
      setErr('');
    } catch (e) {
      setErr(e?.response?.data?.error || 'No se pudieron cargar las visitas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [qp]);

  async function descargarPdf(visitaId) {
    try {
      const { data } = await api.get(`/visitas/${visitaId}/pdf`, {
        responseType: 'blob', // recibe archivo binario
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `visita_${visitaId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al generar el PDF');
      console.error(e);
    }
  }

  return { items, meta, loading, err, reload: load, descargarPdf };
}
