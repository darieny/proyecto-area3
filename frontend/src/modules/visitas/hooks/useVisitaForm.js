import { useState } from "react";
import { visitasApi } from "../../../services/visitas.api.js";

export function useVisitaForm() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function createVisita(form) {
    try {
      setSaving(true);
      setError("");
      // Si subes evidencias primero:
      let evidencias = [];
      if (form.files?.length) {
        const uploads = await Promise.all([...form.files].map(f => visitasApi.uploadFile(f)));
        evidencias = uploads.map(u => u.id);
      }
      const visita = await visitasApi.create({ ...form, evidencias });
      return visita;
    } catch (e) {
      setError(e?.response?.data?.message || "No se pudo crear la visita");
      throw e;
    } finally { setSaving(false); }
  }

  return { createVisita, saving, error };
}
