// src/modules/visitas/hooks/useVisitaForm.js
import { useState } from "react";
import { visitasApi } from "../../../services/visitas.api.js";

export function useVisitaForm() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function createVisita(form) {
    setError("");
    try {
      setSaving(true);
      const visita = await visitasApi.create({
        clienteId: form.clienteId,
        creadoPorId: form.creadoPorId,
        titulo: form.titulo,
        observaciones: form.observaciones,
        ubicacionId: form.ubicacionId ?? null,
        tecnicoId: form.tecnicoId ? Number(form.tecnicoId) : null,
        programadaInicio: form.programadaInicio || undefined,
        programadaFin: form.programadaFin || undefined,
      });
      return visita;
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  return { createVisita, saving, error };
}

