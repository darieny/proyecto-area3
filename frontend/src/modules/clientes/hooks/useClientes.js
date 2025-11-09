import { useEffect, useState, useCallback } from "react";
import { api } from "../../../services/http.js";

export function useClientes({
  search = "",
  order = "recientes",
  page = 1,
  pageSize = 10,
  departamento,
  estado,
  refreshTick = 0,
} = {}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    pageSize,
    totalPages: 1,
  });
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ===== list + summary =====
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const [s, l] = await Promise.all([
          api.get("/clientes/admin/summary"),
          api.get("/clientes", {
            params: {
              search: search || undefined,
              departamento: departamento || undefined,
              estado: estado || undefined,
              order,
              page,
              pageSize,
            },
          }),
        ]);

        if (!alive) return;

        setKpis(s.data);
        setItems(l.data?.data ?? []);
        setMeta((prev) => l.data?.meta ?? prev);
        setErr("");
      } catch (e) {
        if (alive) setErr("No se pudo cargar clientes");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [search, order, page, pageSize, departamento, estado, refreshTick]);

  // ===== get by id =====
  const getCliente = useCallback(async (id) => {
    const { data } = await api.get(`/clientes/${id}`);
    return data;
  }, []);

  // ===== update =====
  const updateCliente = useCallback(async (id, payload) => {
    const { data } = await api.put(`/clientes/${id}`, payload);
    return data;
  }, []);

  // trae la ubicación principal del cliente
  const getUbicacionPrincipal = useCallback(async (clienteId) => {
    const { data } = await api.get(`/ubicaciones/by-cliente/${clienteId}`);
    if (!Array.isArray(data) || data.length === 0) return null;

    const principal = data.find(
      (u) => (u.etiqueta || "").toLowerCase() === "principal"
    );
    if (principal) return principal;

    return data[0];
  }, []);

  return {
    kpis,
    items,
    meta,
    loading,
    err,
    getCliente,
    updateCliente,
    getUbicacionPrincipal,
  };
}


