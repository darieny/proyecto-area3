import { useEffect, useState } from "react";
import { visitasApi } from "../../../services/visitas.api.js";

export function useVisitas(initial = {}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "", page: 1, pageSize: 10,
    tipo: "", prioridad: "", estado: "", from: "", to: "",
    ...initial,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await visitasApi.list(filters);
        if (!alive) return;
        setItems(data.items || []);
        setMeta(data.meta || { total: 0, page: 1, pageSize: filters.pageSize, totalPages: 1 });
        setError("");
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.message || "Error cargando visitas");
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [filters]);

  return { items, meta, loading, error, filters, setFilters };
}
