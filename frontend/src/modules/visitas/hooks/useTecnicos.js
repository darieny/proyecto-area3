import { useEffect, useState } from "react";
import { api } from "../../../services/http.js";

export function useTecnicos() {
  const [tecnicos, setTecnicos] = useState([]);
  useEffect(() => {
    (async () => {
      const { data } = await api.get("/usuarios/tecnicos");
      setTecnicos(data || []);
    })();
  }, []);
  return tecnicos;
}
