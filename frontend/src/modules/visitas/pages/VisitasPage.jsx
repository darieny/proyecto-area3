import { useState } from "react";
import VisitasFilters from "../components/VisitasFilters.jsx";
import VisitasKpis from "../components/VisitasKpis.jsx";
import VisitasTable from "../components/VisitasTable.jsx";
import VisitaDetailDrawer from "../components/VisitaDetailDrawer.jsx";
import { useVisitas } from "../hooks/useVisitas.js";
import "../../visitas/css/visitas.css";

export default function VisitasPage() {
  const { items, meta, loading, filters, setFilters } = useVisitas({ pageSize: 10 });
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function openDetail(v) {
    setSelected(v);
    setDrawerOpen(true);
  }
  function closeDetail() {
    setDrawerOpen(false);
    setSelected(null);
  }
  function updateFromDrawer(v) {
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
