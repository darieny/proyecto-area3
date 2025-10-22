import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";

import VisitasFilters from "../components/VisitasFilters.jsx";
import VisitasKpis from "../components/VisitasKpis.jsx";
import VisitasTable from "../components/VisitasTable.jsx";
import VisitaDetailDrawer from "../components/VisitaDetailDrawer.jsx";
import { useVisitas } from "../hooks/useVisitas.js";
import { useTecnicos } from "../hooks/useTecnicos.js";
import { api } from "../../../services/http.js";
import "../css/visitas.css";

/* ---------- helpers QS ---------- */
function parseQS(sp) {
  const toNum = (v, def) => (v && !Number.isNaN(Number(v)) ? Number(v) : def);
  const val = (k) => (sp.get(k) ?? "").trim() || "";
  return {
    q: val("q"),
    cliente_id: val("cliente_id"),
    type_id: val("type_id"),
    priority_id: val("priority_id"),
    estado: val("estado"),          // PROGRAMADA | EN_RUTA | EN_SITIO | COMPLETADA
    tecnico_id: val("tecnico_id"),
    desde: val("desde"),
    hasta: val("hasta"),
    page: toNum(sp.get("page"), 1),
    pageSize: toNum(sp.get("pageSize"), 10),
    order: val("order") || "recientes",
  };
}

function buildQS(filters) {
  const usp = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== "" && v != null) usp.set(k, String(v));
  });
  return usp;
}

/* ---------- Modal interno para asignar técnico ---------- */
function AsignarTecnicoModal({ open, visita, onClose, onSaved }) {
  const tecnicos = useTecnicos();
  const [tecnicoId, setTecnicoId] = useState("");

  useEffect(() => {
    if (visita) setTecnicoId(visita.tecnico_asignado_id ?? "");
  }, [visita]);

  if (!open || !visita) return null;

  async function onSubmit(e) {
    e.preventDefault();
    await api.patch(`/visitas/${visita.id}/tecnico`, {
      tecnico_id: Number(tecnicoId),
    });
    onSaved?.();
    onClose?.();
  }

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Asignar técnico</h3>
        <form onSubmit={onSubmit} className="form">
          <label>
            Técnico
            <select
              value={tecnicoId || ""}
              onChange={(e) => setTecnicoId(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre_completo}
                </option>
              ))}
            </select>
          </label>
          <div className="row end gap">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ----------------- VISITAS (ADMIN) ----------------------------- */
export default function VisitasPage() {
  const [collapsed, setCollapsed] = useState(false);   // desktop
  const [mobileOpen, setMobileOpen] = useState(false); // móvil

  const [sp, setSp] = useSearchParams();
  const initialFromQS = useMemo(() => parseQS(sp), []); // solo una vez

  const { items, meta, loading, filters, setFilters, reload } = useVisitas({
    pageSize: 10,
    ...initialFromQS,               // ya incluye q/estado/desde/hasta
  });

  // KPIs rápidos (calculados en cliente)
  const kpis = useMemo(() => {
    const now = Date.now();
    const isSameDay = (iso) => {
      if (!iso) return false;
      const d = new Date(iso);
      const t = new Date();
      return (
        d.getFullYear() === t.getFullYear() &&
        d.getMonth() === t.getMonth() &&
        d.getDate() === t.getDate()
      );
    };

    let hoy = 0;
    let atrasadas = 0;
    let semanaCompletadas = 0;

    for (const v of items) {
      if (isSameDay(v.programada_inicio)) hoy += 1;

      // Atrasadas: programadas cuyo fin ya pasó y siguen en PROGRAMADA
      if (v.estado_codigo === "PROGRAMADA") {
        const fin = v.programada_fin ? Date.parse(v.programada_fin) : null;
        if (fin && fin < now) atrasadas += 1;
      }

      // Completadas últimos 7 días (por fecha programada, ajústalo si prefieres real_fin)
      if (v.estado_codigo === "COMPLETADA") {
        const ini = v.programada_inicio ? Date.parse(v.programada_inicio) : null;
        if (ini && now - ini <= 7 * 24 * 3600 * 1000) semanaCompletadas += 1;
      }
    }

    return { hoy, atrasadas, semanaCompletadas };
  }, [items]);

  // Sincroniza la URL con los filtros activos
  useEffect(() => {
    setSp(buildQS(filters), { replace: true });
  }, [filters, setSp]);

  // Drawer (detalle)
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDetail = (v) => { setSelected(v); setDrawerOpen(true); };
  const closeDetail = () => { setSelected(null); setDrawerOpen(false); };
  const updateFromDrawer = () => { closeDetail(); setFilters({ ...filters }); };

  // Modal "Asignar técnico"
  const [asignarOpen, setAsignarOpen] = useState(false);
  const [visitaAsignar, setVisitaAsignar] = useState(null);
  const openAsignar = (v) => { setVisitaAsignar(v); setAsignarOpen(true); };
  const closeAsignar = () => { setVisitaAsignar(null); setAsignarOpen(false); };
  const onAsignado = async () => { closeAsignar(); await reload?.(); };

  return (
    <div className={`shell ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "menu-open" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        onNavigate={() => setMobileOpen(false)}
      />

      <main className="main">
        <Topbar
          onToggleCollapse={() => setCollapsed(v => !v)}
          onToggleMobile={() => setMobileOpen(v => !v)}
        />

        <div className="page">
          <div className="page-header">
            <h2>Visitas</h2>
          </div>

          <VisitasKpis stats={kpis} />

          {/* VisitasFilters debe leer/escribir q, estado, desde, hasta, etc. */}
          <VisitasFilters value={filters} onChange={setFilters} />

          <VisitasTable
            items={items}
            meta={meta}
            loading={loading}
            onOpenDetail={openDetail}
            onPageChange={(p) => setFilters({ ...filters, page: p })}
            onAssignTecnico={openAsignar}
          />

          <VisitaDetailDrawer
            open={drawerOpen}
            onClose={closeDetail}
            visita={selected}
            onUpdated={updateFromDrawer}
          />

          <AsignarTecnicoModal
            open={asignarOpen}
            visita={visitaAsignar}
            onClose={closeAsignar}
            onSaved={onAsignado}
          />
        </div>
      </main>
    </div>
  );
}



