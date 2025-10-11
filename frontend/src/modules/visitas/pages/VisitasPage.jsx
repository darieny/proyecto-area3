import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import VisitasFilters from "../components/VisitasFilters.jsx";
import VisitasKpis from "../components/VisitasKpis.jsx";
import VisitasTable from "../components/VisitasTable.jsx";
import VisitaDetailDrawer from "../components/VisitaDetailDrawer.jsx";
import { useVisitas } from "../hooks/useVisitas.js";
import "../css/visitas.css";

/**
 * Parse helpers: lee filtros desde la URL y los normaliza
 */
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
  const entries = Object.entries(filters)
    .filter(([_, v]) => v !== "" && v != null); // evita ruido en la URL
  const usp = new URLSearchParams();
  for (const [k, v] of entries) usp.set(k, String(v));
  return usp;
}

export default function VisitasPage() {
  const [sp, setSp] = useSearchParams();

  // 1) hidrata filtros desde la URL al montar
  const initialFromQS = useMemo(() => parseQS(sp), []); // solo 1 vez

  const { items, meta, loading, filters, setFilters } = useVisitas({
    pageSize: 10,
    ...initialFromQS,
  });

  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 2) sincroniza URL cada vez que cambian los filtros
  useEffect(() => {
    const qs = buildQS(filters);
    setSp(qs, { replace: true }); // replace para no romper el historial
  }, [filters, setSp]);

  function openDetail(v) {
    setSelected(v);
    setDrawerOpen(true);
  }
  function closeDetail() {
    setDrawerOpen(false);
    setSelected(null);
  }
  function updateFromDrawer(_v) {
    // tras cambiar estado, refrescamos tocando filters
    closeDetail();
    setFilters({ ...filters });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Visitas</h2>
      </div>

      <VisitasKpis stats={{ hoy: 0, atrasadas: 0, semanaCompletadas: 0 }} />

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
  );
}

