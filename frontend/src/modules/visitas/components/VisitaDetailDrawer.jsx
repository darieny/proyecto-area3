import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { visitasApi } from "../../../services/visitas.api.js";
import { api } from "../../../services/http.js";
import "../css/visitas.css";

function fmt(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "—";
  }
}

export default function VisitaDetailDrawer({ open, onClose, visita, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estado seleccionado
  const [estadoId, setEstadoId] = useState(null);
  // Opciones del catálogo VISITA_STATUS
  const [statusOptions, setStatusOptions] = useState([]);
  const [saving, setSaving] = useState(false);

  // Bloquea el scroll cuando el drawer está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Carga detalle y catálogo de estados
  useEffect(() => {
    if (!open || !visita) return;


    setData(visita ?? null);
    setEstadoId(
      visita?.status_id != null ? Number(visita.status_id) : null
    );

    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // 1) detalle completo
        const full = await visitasApi.getById(visita.id);
        if (!alive) return;
        setData(full ?? null);
        if (full?.status_id != null) setEstadoId(Number(full.status_id));

        // 2) catálogo de estados 
        let cats = [];
        if (typeof visitasApi.getStatusCatalog === "function") {
          cats = await visitasApi.getStatusCatalog();
        }

        if (!Array.isArray(cats) || !cats.length) {
          const current = full?.status_id != null
            ? [{ id: Number(full.status_id), etiqueta: full?.status_etiqueta ?? "—" }]
            : [];
          setStatusOptions(current);
        } else {
          setStatusOptions(
            cats.map(c => ({ id: Number(c.id), etiqueta: c.etiqueta }))
          );
        }
      } catch (e) {
        console.error("No se pudo cargar detalle o catálogo", e?.response?.data || e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [open, visita]);

  async function guardarEstado() {
    if (!data?.id || estadoId == null) return;
    try {
      setSaving(true);
      const updated =
        typeof visitasApi.patchEstado === "function"
          ? await visitasApi.patchEstado(data.id, Number(estadoId))
          : await visitasApi.patch(data.id, { status_id: Number(estadoId) });

      setData(updated ?? data);
      onUpdated?.(updated);
    } catch (e) {
      console.error("No se pudo actualizar estado", e?.response?.data || e);
      alert("No se pudo actualizar el estado");
    } finally {
      setSaving(false);
    }
  }

  // Nombre del cliente
  const clienteNombre = useMemo(() => {
    if (!data) return "—";
    return data.cliente_nombre ?? (data.cliente_id ? `Cliente #${data.cliente_id}` : "—");
  }, [data]);

  if (!open) return null;

  return createPortal(
    <div className="drawer open">
      <div className="drawer__panel">
        <header className="drawer__header">
          <h3>Visita</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div className="drawer__body">
          {!data ? (
            <div>Cargando…</div>
          ) : (
            <div className="v-group">
              <div className="v-item">
                <div className="label">Cliente</div>
                <div className="value">{clienteNombre}</div>
              </div>

              <div className="v-item">
                <div className="label">Título</div>
                <div className="value"><b>{data?.titulo ?? "—"}</b></div>
              </div>

              <div className="v-item">
                <div className="label">Fecha programada</div>
                <div className="value">
                  {fmt(data?.programada_inicio)}
                  {data?.programada_fin ? ` • ${fmt(data.programada_fin)}` : ""}
                </div>
              </div>

              <div className="v-item">
                <div className="label">Tipo</div>
                <div className="value">{data?.type_etiqueta ?? "—"}</div>
              </div>

              <div className="v-item">
                <div className="label">Prioridad</div>
                <div className="value">{data?.priority_etiqueta ?? "—"}</div>
              </div>

              <div className="v-item">
                <div className="label">Ubicación</div>
                <div className="value">
                  {data?.ubicacion_etiqueta ??
                    (data?.ubicacion_ciudad && data?.ubicacion_departamento
                      ? `${data.ubicacion_ciudad}, ${data.ubicacion_departamento}`
                      : data?.ubicacion_ciudad || data?.ubicacion_departamento) ??
                    "—"}
                </div>
              </div>

              <div className="v-item">
                <div className="label">Estado</div>
                <div className="value">
                  <select
                    className="input"
                    value={estadoId ?? ""}
                    onChange={(e) => setEstadoId(Number(e.target.value))}
                    disabled={saving || loading || !statusOptions.length}
                  >
                    {!statusOptions.length && (
                      <option value="">
                        {data?.status_etiqueta ?? "Cargando…"}
                      </option>
                    )}
                    {statusOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.etiqueta}
                      </option>
                    ))}
                  </select>
                  {/* Etiqueta actual al lado, por claridad */}
                  {data?.status_etiqueta && (
                    <small style={{ marginLeft: 8, color: "#64748b" }}>
                      Actual: {data.status_etiqueta}
                    </small>
                  )}
                </div>
              </div>

              <div className="v-item">
                <div className="label">Observaciones</div>
                <div className="value">
                  {data?.descripcion ?? data?.observaciones ?? "—"}
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="drawer__footer">
          <button className="btn ghost" onClick={onClose}>Cerrar</button>

          {data?.id && (
            <button className="btn" onClick={async () => {
              try {
                const res = await api.get(`/visitas/${data.id}/pdf`, { responseType: "blob" });
                const blob = new Blob([res.data], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Visita_${data.id}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error("Error al descargar PDF:", err?.response?.data || err);
                alert("No se pudo generar el PDF de la visita.");
              }
            }} disabled={loading}>
              Descargar PDF
            </button>
          )}

          <button
            className="btn primary"
            onClick={guardarEstado}
            disabled={saving || loading || estadoId == null}
          >
            {saving ? "Guardando…" : "Guardar estado"}
          </button>
        </footer>
      </div>

      <div className="drawer__backdrop" onClick={onClose} />
    </div>,
    document.body
  );
}

