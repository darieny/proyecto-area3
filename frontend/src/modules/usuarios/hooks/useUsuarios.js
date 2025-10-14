import { useEffect, useState, useCallback } from "react";
import { api } from "../../../services/http.js";

export function useUsuarios() {
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [rRoles, rUsers] = await Promise.all([
        api.get("/usuarios/roles"),
        api.get("/usuarios"),
      ]);
      setRoles(rRoles.data || rRoles);
      setItems(rUsers.data || rUsers);
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const create = useCallback(async (payload) => {
    const { data } = await api.post("/usuarios", payload);
    await loadAll();
    return data;
  }, [loadAll]);

  const update = useCallback(async (id, payload) => {
    const { data } = await api.patch(`/usuarios/${id}`, payload);
    await loadAll();
    return data;
  }, [loadAll]);

  const changePassword = useCallback(async (id, password) => {
    const { data } = await api.patch(`/usuarios/${id}/password`, { password });
    return data;
  }, []);

  return { items, roles, loading, err, create, update, changePassword, reload: loadAll };
}
