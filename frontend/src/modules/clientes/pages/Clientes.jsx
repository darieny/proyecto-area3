import { useState } from "react";
import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";
import { useClientes } from "../hooks/useClientes.js";
import ClienteKpis from "../components/ClienteKpis";
import ClientesTable from "../components/ClientesTable";
import "../css/Clientes.css";

const PAGE_SIZE = 10;

export default function ClientesPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("recientes"); // 'recientes'|'nombre_asc'|'nombre_desc'
  const [page, setPage] = useState(1);

  const { kpis, items, meta, loading, err } = useClientes({
    search,
    order,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div
      className={`shell ${collapsed ? "is-collapsed" : ""} ${
        mobileOpen ? "menu-open" : ""
      }`}
    >
      <Sidebar collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      <main className="main">
        <Topbar
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onToggleMobile={() => setMobileOpen((v) => !v)}
        />

        <div className="clientes">
          {loading && <div className="skeleton">Cargando clientes…</div>}
          {err && !loading && <div className="error">{err}</div>}

          {!loading && !err && (
            <>
              <ClienteKpis kpis={kpis} />

              <section className="clientes__card">
                <header className="clientes__header">
                  <h2>Clientes</h2>
                  <div className="clientes__actions">
                    <div className="input-search">
                      <span className="ico">🔍</span>
                      <input
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                        placeholder="Buscar"
                      />
                    </div>

                    <div className="dropdown">
                      <button className="btn-filter">
                        Filtrar por:{" "}
                        <strong>
                          {order === "recientes"
                            ? "Recientes"
                            : order === "nombre_asc"
                            ? "Nombre (A–Z)"
                            : "Nombre (Z–A)"}
                        </strong>{" "}
                        ▾
                      </button>
                      <div className="dropdown__menu">
                        <button onClick={() => setOrder("recientes")}>
                          Recientes
                        </button>
                        <button onClick={() => setOrder("nombre_asc")}>
                          Nombre (A–Z)
                        </button>
                        <button onClick={() => setOrder("nombre_desc")}>
                          Nombre (Z–A)
                        </button>
                      </div>
                    </div>
                  </div>
                </header>

                <ClientesTable items={items} />

                {/* Paginación mockup */}
                <footer className="pager">
                  <button
                    disabled={meta.page <= 1}
                    onClick={() => setPage(meta.page - 1)}
                  >
                    ‹
                  </button>

                  {/* primeras páginas visibles */}
                  {[...Array(Math.min(5, meta.totalPages))].map((_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        className={p === meta.page ? "is-active" : ""}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    );
                  })}

                  {/* mostrar elipsis y último número solo si hay más de 5 páginas */}
                  {meta.totalPages > 5 && (
                    <>
                      <span className="ellipsis">…</span>
                      <button
                        className={
                          meta.page === meta.totalPages ? "is-active" : ""
                        }
                        onClick={() => setPage(meta.totalPages)}
                      >
                        {meta.totalPages}
                      </button>
                    </>
                  )}

                  <button
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage(meta.page + 1)}
                  >
                    ›
                  </button>
                </footer>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
