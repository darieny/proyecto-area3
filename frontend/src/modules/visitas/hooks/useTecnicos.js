import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/http";


export function useTecnicosState({ scope = "admin", auto = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const endpoint =
    scope === "supervisor" ? "/supervisor/tecnicos" : "/usuarios/tecnicos";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(endpoint);
      // Acepta respuesta plana o { items: [...] }
      const list = Array.isArray(data) ? data : (data?.items || []);
      setItems(list);
      setErr("");
    } catch (e) {
      console.error("Error cargando técnicos:", e);
      setItems([]);
      setErr(e?.response?.data?.error || "No se pudieron cargar los técnicos");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (auto) load();
  }, [auto, load]);

  return { items, loading, err, reload: load };
}

export function useTecnicos(opts = {}) {
  const { items, loading, err } = useTecnicosState(opts);
  return { items, loading, err };
}
