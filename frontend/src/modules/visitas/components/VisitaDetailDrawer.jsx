import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { visitasApi } from "../../../services/visitas.api.js";
import { api } from "../../../services/http.js";
import "../css/visitas.css";

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
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "—";
  }
}

export default function VisitaDetailDrawer({
  open,
  onClose,
  visita,
  onUpdated,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [estado, setEstado] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !visita) return;

    setData(visita ?? null);
    setEstado(Number(visita?.status_id ?? 1));

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const full = await visitasApi.getById(visita.id);
        console.log("DETALLE VISITA FULL >>>", full);
        if (!alive) return;
        setData(full ?? null);
        if (full?.status_id != null) setEstado(Number(full.status_id));
      } catch (e) {
        console.error(
          "No se pudo cargar detalle de visita",
          e?.response?.data || e
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, visita]);

  async function guardarEstado() {
    if (!data?.id) return;
    try {
      setSaving(true);
      const updated =
        typeof visitasApi.patchEstado === "function"
          ? await visitasApi.patchEstado(data.id, Number(estado))
          : await visitasApi.patch(data.id, { status_id: Number(estado) });

      setData(updated ?? data);
      onUpdated?.(updated);
    } catch (e) {
      console.error("No se pudo actualizar estado", e?.response?.data || e);
      alert("No se pudo actualizar el estado");
    } finally {
      setSaving(false);
    }
  }

  // Descarga del PDF con Bearer token (blob)
  async function descargarPdf(id) {
    try {
      const res = await api.get(`/visitas/${id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Visita_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar PDF:", err?.response?.data || err);
      alert("No se pudo generar el PDF de la visita.");
    }
  }

  const clienteNombre = useMemo(() => {
    if (!data) return "—";
    return (
      data.cliente_nombre ??
      (data.cliente_id ? `Cliente #${data.cliente_id}` : "—")
    );
  }, [data]);

  if (!open) return null;

  return createPortal(
    <div className="drawer open">
      <div className="drawer__panel">
        <header className="drawer__header">
          <h3>Visita</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
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
                <div className="value">
                  <b>{data?.titulo ?? "—"}</b>
                </div>
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
                <div className="value">{data?.tipo ?? "—"}</div>
              </div>

              <div className="v-item">
                <div className="label">Prioridad</div>
                <div className="value">{data?.prioridad ?? "—"}</div>
              </div>

              <div className="v-item">
                <div className="label">Teléfono</div>
                <div className="value">{data?.telefono ?? "—"}</div>
              </div>

              <div className="v-item">
                <div className="label">Ubicación</div>
                <div className="value">
                  {data?.ubicacion_etiqueta ??
                    data?.direccion ??
                    data?.direccion_linea1 ??
                    "—"}
                </div>
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
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
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
          <button className="btn ghost" onClick={onClose}>
            Cerrar
          </button>

          {data?.id && (
            <button
              className="btn"
              onClick={() => descargarPdf(data.id)}
              disabled={loading}
            >
              Descargar PDF
            </button>
          )}

          <button
            className="btn primary"
            onClick={guardarEstado}
            disabled={saving || loading || !data}
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

