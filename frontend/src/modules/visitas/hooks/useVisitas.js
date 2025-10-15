import { useEffect, useState, useCallback } from "react";
import { visitasApi } from "../../../services/visitas.api.js";

export function useVisitas(initial = {}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    pageSize: 10,
    tipo: "",
    prioridad: "",
    estado: "",         
    from: "",
    to: "",
    ...initial,
  });

  // helper para setFilters que siempre resetea a página 1
  function updateFilters(partial) {
    setFilters((f) => ({ ...f, page: 1, ...partial }));
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // convertir fechas a ISO si vienen como yyyy-mm-dd
        const q = { ...filters };
        if (q.from && q.from.length <= 10) q.from = new Date(q.from + "T00:00:00").toISOString();
        if (q.to && q.to.length <= 10)     q.to   = new Date(q.to   + "T23:59:59").toISOString();

        const data = await visitasApi.list(q);
        if (!alive) return;
        setItems(data.items || []);
        setMeta(data.meta || { total: 0, page: q.page, pageSize: q.pageSize, totalPages: 1 });
        setError("");
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.message || "Error cargando visitas");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [filters]);

  const assignTecnico = useCallback(async (visitaId, tecnicoIdOrNull) => {
    await visitasApi.assignTecnico(visitaId, tecnicoIdOrNull);
    setFilters((f) => ({ ...f })); 
  }, []);

  return { items, meta, loading, error, filters, setFilters: updateFilters, assignTecnico };
}


