import { createPortal } from "react-dom";
import { useState } from "react";
import { visitasApi } from "../../../services/visitas.api.js";

/**
 * Drawer lateral para ver/editar estado y evidencias rápidas.
 * Props:
 *  - open, onClose
 *  - visita: objeto
 *  - onUpdated(visita)
 */
export default function VisitaDetailDrawer({ open, onClose, visita, onUpdated }) {
  const [working, setWorking] = useState(false);
  const [estado, setEstado] = useState(visita?.estado || "programada");

  if (!open || !visita) return null;

  async function changeEstado() {
    try {
      setWorking(true);
      const v = await visitasApi.patch(visita.id, { estado });
      onUpdated?.(v);
    } finally {
      setWorking(false);
    }
  }

  return createPortal(
    <div className="drawer-overlay">
      <aside className="drawer">
        <div className="drawer-header">
          <h3>Visita</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <div className="field">
            <div className="muted">Cliente</div>
            <div>{visita.cliente_nombre || visita.cliente_id}</div>
          </div>

          <div className="field"><div className="muted">Tipo</div><div>{visita.tipo}</div></div>
          <div className="field"><div className="muted">Prioridad</div><div>{visita.prioridad}</div></div>
          <div className="field"><div className="muted">Estado</div>
            <select className="input" value={estado} onChange={(e)=>setEstado(e.target.value)}>
              <option value="programada">Programada</option>
              <option value="en_progreso">En progreso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="field">
            <div className="muted">Observaciones</div>
            <div className="pre">{visita.observaciones || "-"}</div>
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn ghost" onClick={onClose}>Cerrar</button>
          <button className="btn primary" onClick={changeEstado} disabled={working}>
            {working ? "Guardando…" : "Guardar estado"}
          </button>
        </div>
      </aside>
    </div>,
    document.body
  );
}
