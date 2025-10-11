// src/modules/visitas/components/VisitaDetailDrawer.jsx
import { useEffect, useMemo, useState } from "react";
import { visitasApi } from "../../../services/visitas.api.js";

const STATUS = {
  1: "Programada",
  2: "En progreso",
  3: "Completada",
  4: "Cancelada",
  5: "Pendiente",
};

function fmt(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export default function VisitaDetailDrawer({ open, onClose, visita, onUpdated }) {
  const [data, setData] = useState(null);     // detalle de la visita
  const [loading, setLoading] = useState(false);

  // para cambiar estado
  const [estado, setEstado] = useState(1);
  const [saving, setSaving] = useState(false);

  // Cargar detalle al abrir
  useEffect(() => {
    if (!open || !visita) return;

    // usa lo que ya viene de la fila mientras carga
    setData(visita);
    setEstado(Number(visita.status_id || 1));

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        // trae el detalle completo por id
        const full = await visitasApi.getById(visita.id);
        if (!alive) return;
        setData(full);
        if (full?.status_id != null) setEstado(Number(full.status_id));
      } catch (e) {
        console.error("No se pudo cargar detalle de visita", e?.response?.data || e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [open, visita]);

  async function guardarEstado() {
    if (!data?.id) return;
    try {
      setSaving(true);
      const updated = await visitasApi.patchEstado(data.id, Number(estado));
      setData(updated);
      onUpdated?.(updated);
    } catch (e) {
      console.error("No se pudo actualizar estado", e?.response?.data || e);
      alert("No se pudo actualizar el estado");
    } finally {
      setSaving(false);
    }
  }

  const clienteNombre = useMemo(() => data?.cliente_nombre || `Cliente #${data?.cliente_id || "—"}`, [data]);

  if (!open) return null;

  return (
    <div className={`drawer ${open ? "open" : ""}`}>
      <div className="drawer__panel">
        <header className="drawer__header">
          <h3>Visita</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </header>

        {!data ? (
          <div className="drawer__body">Cargando…</div>
        ) : (
          <div className="drawer__body">
            <div className="v-group">
              <div className="v-item">
                <div className="label">Cliente</div>
                <div className="value">{clienteNombre}</div>
              </div>

              <div className="v-item">
                <div className="label">Título</div>
                <div className="value"><b>{data.titulo || "—"}</b></div>
              </div>

              <div className="v-item">
                <div className="label">Fecha programada</div>
                <div className="value">
                  {fmt(data.programada_inicio)}
                  {data.programada_fin ? ` • ${fmt(data.programada_fin)}` : ""}
                </div>
              </div>

              {/* si el backend no devuelve tipo/prioridad, estos quedarán en "—" */}
              <div className="v-item">
                <div className="label">Tipo</div>
                <div className="value">{data.tipo || "—"}</div>
              </div>

              <div className="v-item">
                <div className="label">Prioridad</div>
                <div className="value">{data.prioridad || "—"}</div>
              </div>

              <div className="v-item">
                <div className="label">Teléfono</div>
                <div className="value">{data.telefono || "—"}</div>
              </div>

              <div className="v-item">
                <div className="label">Ubicación</div>
                <div className="value">{data.ubicacion_etiqueta || data.direccion || data.direccion_linea1 || "—"}</div>
              </div>

              <div className="v-item">
                <div className="label">Estado</div>
                <div className="value">
                  <select
                    className="input"
                    value={estado}
                    onChange={(e) => setEstado(Number(e.target.value))}
                    disabled={saving}
                  >
                    {Object.entries(STATUS).map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="v-item">
                <div className="label">Observaciones</div>
                <div className="value">{data.descripcion || data.observaciones || "—"}</div>
              </div>

              {/* Si luego tienes evidencias */}
              {Array.isArray(data.evidencias) && data.evidencias.length > 0 && (
                <div className="v-item">
                  <div className="label">Evidencias</div>
                  <div className="value">
                    <ul className="list clean">
                      {data.evidencias.map((evi) => (
                        <li key={evi.id || evi}>{evi.nombre || evi.url || evi}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="drawer__footer">
          <button className="btn ghost" onClick={onClose}>Cerrar</button>
          <button className="btn primary" onClick={guardarEstado} disabled={saving || loading}>
            {saving ? "Guardando…" : "Guardar estado"}
          </button>
        </footer>
      </div>

      {/* backdrop */}
      <div className="drawer__backdrop" onClick={onClose} />
    </div>
  );
}
