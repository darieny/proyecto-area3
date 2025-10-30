import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/http";

export function useTecnicosState({ scope = "admin", auto = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // endpoint según el contexto/rol
  const endpoint = scope === "supervisor"
    ? "/supervisor/tecnicos"
    : "/usuarios/tecnicos";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.get(endpoint);
      const list = Array.isArray(r.data) ? r.data : (r.data?.items || []);
      setItems(list);
      setErr("");
    } catch (e) {
      setItems([]);
      setErr(e?.response?.data?.error || "No se pudieron cargar los técnicos");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { if (auto) load(); }, [auto, load]);

  return { items, loading, err, reload: load };
}

// Hook retro-compatible: devuelve sólo el array
export function useTecnicos(opts) {
  const { items } = useTecnicosState(opts);
  return items;
}
