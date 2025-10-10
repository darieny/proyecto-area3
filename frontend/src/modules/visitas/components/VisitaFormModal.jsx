import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useVisitaForm } from "../hooks/useVisitaForm.js";

/**
 * Modal para crear visitas.
 * Props:
 *  - open: bool
 *  - onClose: fn
 *  - clienteId: (opcional) si abre desde detalle del cliente
 *  - prefill: { direccion, telefono } (opcionales)
 *  - onSaved: fn(visita) callback cuando se guarda
 */
export default function VisitaFormModal({ open, onClose, clienteId, prefill = {}, onSaved }) {
  const { createVisita, saving, error } = useVisitaForm();
  const [form, setForm] = useState({
    clienteId: clienteId || "",
    ubicacionId: null,
    telefono: prefill.telefono || "",
    tipo: "mantenimiento",
    prioridad: "normal",
    observaciones: "",
    files: [], // FileList
  });

  // Si cambian prefill/clienteId desde fuera:
  useEffect(() => {
    setForm((f) => ({
      ...f,
      clienteId: clienteId || f.clienteId,
      telefono: prefill.telefono ?? f.telefono,
    }));
  }, [clienteId, prefill.telefono]);

  const fileInputRef = useRef(null);

  const canSubmit = useMemo(() => {
    return form.clienteId && form.tipo && form.prioridad && !saving;
  }, [form, saving]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleFiles(e) {
    setForm((f) => ({ ...f, files: e.target.files }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const visita = await createVisita(form);
    onSaved?.(visita);
    onClose?.();
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
          {/* Cliente (en esta versión mínima, input de texto o id) */}
          <label className="form-label">Cliente</label>
          <input
            className="input"
            name="clienteId"
            value={form.clienteId}
            onChange={handleChange}
            placeholder="UUID o buscar (pendiente autocomplete)"
            required
          />

          <div className="grid-2">
            <div>
              <label className="form-label">Dirección</label>
              <input
                className="input"
                name="direccion"
                value={prefill.direccion || ""}
                placeholder="Autocompletado"
                disabled
              />
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
              placeholder="Ej: Cliente reporta baja intensidad de señal…"
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
