import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useVisitaForm } from "../hooks/useVisitaForm.js";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function VisitaFormModal({ open, onClose, clienteId, prefill = {}, onSaved }) {
  const { user } = useAuth();
  const { createVisita, saving, error } = useVisitaForm();
  const [form, setForm] = useState({
    clienteId: clienteId || "",
    ubicacionId: prefill.ubicacionId ?? null,
    telefono: prefill.telefono || "",
    tipo: "mantenimiento",
    prioridad: "normal",
    observaciones: "",
    files: [],
    creadoPorId: user?.id ?? null,
  });

  useEffect(() => {
    setForm((f) => ({
      ...f,
      clienteId: clienteId || f.clienteId,
      telefono: prefill.telefono ?? f.telefono,
      ubicacionId: prefill.ubicacionId ?? f.ubicacionId,
      creadoPorId: user?.id ?? f.creadoPorId,
    }));
  }, [clienteId, prefill.telefono, prefill.ubicacionId, user?.id]);
  
  

  const fileInputRef = useRef(null);
  const canSubmit = useMemo(() => form.clienteId && !saving, [form, saving]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleFiles(e) {
    setForm((f) => ({ ...f, files: e.target.files }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const visita = await createVisita(form);
      onSaved?.(visita);
      onClose?.();
    } catch (e) {
      console.error("Error creando visita:", e.response?.data || e.message);
    }
  }

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Agregar nueva visita</h3>
          <button className="btn-icon" onClick={onClose} type="button">✕</button>
        </div>

        <form className="modal-body visitas-form" onSubmit={handleSubmit}>
          <div className="grid-2">
            <div>
              <label className="form-label">Dirección</label>
              <input className="input" value={prefill.direccion || ""} disabled />
            </div>
            <div>
              <label className="form-label">Teléfono</label>
              <input
                className="input"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Autocompletado / editable"
              />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label className="form-label">Tipo de visita</label>
              <select className="input" name="tipo" value={form.tipo} onChange={handleChange}>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="instalacion">Instalación</option>
                <option value="soporte">Soporte</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="form-label">Prioridad</label>
              <select className="input" name="prioridad" value={form.prioridad} onChange={handleChange}>
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Adjuntar foto/evidencia</label>
            <input
              ref={fileInputRef}
              className="input"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFiles}
            />
          </div>

          <div>
            <label className="form-label">Observaciones</label>
            <textarea
              className="textarea"
              name="observaciones"
              rows={4}
              value={form.observaciones}
              onChange={handleChange}
              placeholder="Ej: Cliente reporta lentitud…"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-footer">
            <button className="btn ghost" type="button" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="btn primary" type="submit" disabled={!canSubmit}>
              {saving ? "Guardando..." : "Guardar visita"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

