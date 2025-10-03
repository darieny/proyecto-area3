import { useEffect, useState } from 'react';
import { api } from '../../../services/http.js';

  export function useClientes({ search = '', order = 'recientes', page = 1, pageSize = 10, departamento, estado }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize, totalPages: 1 });
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [s, l] = await Promise.all([
          api.get('/clientes/admin/summary'),
          api.get('/clientes', {
            params: {
              search: search || undefined,
              departamento: departamento || undefined,
              estado: estado || undefined, // 'activo' | 'inactivo'
              order,
              page,
              pageSize,
            },
          }),
        ]);
        if (!alive) return;
        setKpis(s.data);                       // { total, nuevos_mes, sin_visitas }
        setItems(l.data?.data ?? []);          // lista
        setMeta(l.data?.meta ?? meta);         // { total, page, pageSize, totalPages }
      } catch (e) {
        if (alive) setErr('No se pudo cargar clientes');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [search, order, page, pageSize, departamento, estado]);

  return { kpis, items, meta, loading, err };
}
