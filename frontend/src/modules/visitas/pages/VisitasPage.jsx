import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";

import VisitasFilters from "../components/VisitasFilters.jsx";
import VisitasKpis from "../components/VisitasKpis.jsx";
import VisitasTable from "../components/VisitasTable.jsx";
import VisitaDetailDrawer from "../components/VisitaDetailDrawer.jsx";
import { useVisitas } from "../hooks/useVisitas.js";
import "../css/visitas.css";

function parseQS(sp) {
  const toNum = (v, def) => (v && !Number.isNaN(Number(v)) ? Number(v) : def);
  const val = (k) => (sp.get(k) ?? "").trim() || "";
  return {
    search: val("search"),
    cliente_id: val("cliente_id"),
    tipo: val("tipo"),
    prioridad: val("prioridad"),
    estado: val("estado"),
    from: val("from"),
    to: val("to"),
    page: toNum(sp.get("page"), 1),
    pageSize: toNum(sp.get("pageSize"), 10),
  };
}

function buildQS(filters) {
  const usp = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== "" && v != null) usp.set(k, String(v));
  });
  return usp;
}

export default function VisitasPage() {
  const [collapsed, setCollapsed] = useState(false);   // desktop
  const [mobileOpen, setMobileOpen] = useState(false); // cel
  const [sp, setSp] = useSearchParams();
  const initialFromQS = useMemo(() => parseQS(sp), []); // hidrata una vez

  const { items, meta, loading, filters, setFilters } = useVisitas({
    pageSize: 10,
    ...initialFromQS,
  });

  // KPIs rápidos en cliente (provisorios)
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

      // atrasadas: programadas con fin ya pasado
      if (Number(v.status_id) === 1) {
        const fin = v.programada_fin ? Date.parse(v.programada_fin) : null;
        if (fin && fin < now) atrasadas += 1;
      }

      // completadas últimos 7 días
      if (Number(v.status_id) === 3) {
        const ini = v.programada_inicio ? Date.parse(v.programada_inicio) : null;
        if (ini && now - ini <= 7 * 24 * 3600 * 1000) semanaCompletadas += 1;
      }
    }

    return { hoy, atrasadas, semanaCompletadas };
  }, [items]);

  // sincroniza la URL con los filtros
  useEffect(() => {
    setSp(buildQS(filters), { replace: true });
  }, [filters, setSp]);

  // Drawer
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDetail = (v) => { setSelected(v); setDrawerOpen(true); };
  const closeDetail = () => { setSelected(null); setDrawerOpen(false); };
  const updateFromDrawer = () => { closeDetail(); setFilters({ ...filters }); };

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

          <VisitasFilters value={filters} onChange={setFilters} />

          <VisitasTable
            items={items}
            meta={meta}
            loading={loading}
            onOpenDetail={openDetail}
            onPageChange={(p) => setFilters({ ...filters, page: p })}
          />

          <VisitaDetailDrawer
            open={drawerOpen}
            onClose={closeDetail}
            visita={selected}
            onUpdated={updateFromDrawer}
          />
        </div>
      </main>
    </div>
  );
}

