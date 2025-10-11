import { useEffect, useMemo, useState, useCallback } from "react";
import { visitasApi } from "../../../services/visitas.api.js";

export function useVisitas(initial = {}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await visitasApi.list(filters);
      setItems(data.items || []);
      setMeta(
        data.meta || {
          total: 0,
          page: 1,
          pageSize: filters.pageSize,
          totalPages: 1,
        }
      );
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Error cargando visitas");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // permite refrescar manualmente
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { items, meta, loading, error, filters, setFilters, refresh };
}

