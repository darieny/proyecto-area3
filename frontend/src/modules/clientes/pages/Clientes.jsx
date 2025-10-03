import { useState } from "react";
import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";
import { useClientes } from "../hooks/useClientes.js";
import ClienteKpis from "../components/ClienteKpis";
import ClientesTable from "../components/ClientesTable";
import { api } from "../../../services/http.js";
import "../css/Clientes.css";

const PAGE_SIZE = 10;

export default function ClientesPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("recientes"); // 'recientes'|'nombre_asc'|'nombre_desc'
  const [page, setPage] = useState(1);

  // tick para forzar refetch luego de crear
  const [refreshTick, setRefreshTick] = useState(0);

  const { kpis, items, meta, loading, err } = useClientes({
    search,
    order,
    page,
    pageSize: PAGE_SIZE,
    refreshTick,
  });

  // ======= Modal: estado y handlers =======
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    nit: "",
    ciudad: "",
    departamento: "",
    notas: "",
    estado: "activo",
  });

  function openModal() {
    setForm({
      nombre: "",
      correo: "",
      telefono: "",
      nit: "",
      ciudad: "",
      departamento: "",
      notas: "",
      estado: "activo",
    });
    setShowModal(true);
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    try {
      setSaving(true);
      await api.post("/clientes", {
        nombre: form.nombre.trim(),
        correo: form.correo || null,
        telefono: form.telefono || null,
        nit: form.nit || null,
        ciudad: form.ciudad || null,
        departamento: form.departamento || null,
        notas: form.notas || null,
        estado: form.estado || "activo",
      });

      setShowModal(false);
      setPage(1);                 // vuelve a la primera página
      setRefreshTick((t) => t + 1); // fuerza refetch
    } catch (err) {
      console.error("Error creando cliente", err);
      alert("No se pudo crear el cliente");
    } finally {
      setSaving(false);
    }
  }

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
                    {/* Botón agregar */}
                    <button className="btn-primary" onClick={openModal}>
                      + Agregar Cliente
                    </button>

                    {/* Buscador */}
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

                    {/* Filtro / Orden */}
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

                  {/* elipsis + última página si aplica */}
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

      {/* ===== Modal Crear Cliente ===== */}
      {showModal && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__content">
            <h3>Nuevo Cliente</h3>
            <form onSubmit={handleCreate} className="form-grid">
              <label>
                <span>Nombre *</span>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  required
                />
              </label>

              <label>
                <span>Correo</span>
                <input
                  name="correo"
                  type="email"
                  value={form.correo}
                  onChange={onChange}
                />
              </label>

              <label>
                <span>Teléfono</span>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={onChange}
                />
              </label>

              <label>
                <span>NIT / Empresa</span>
                <input name="nit" value={form.nit} onChange={onChange} />
              </label>

              <label>
                <span>Ciudad</span>
                <input name="ciudad" value={form.ciudad} onChange={onChange} />
              </label>

              <label>
                <span>Departamento</span>
                <input
                  name="departamento"
                  value={form.departamento}
                  onChange={onChange}
                />
              </label>

              <label className="full">
                <span>Notas</span>
                <textarea
                  name="notas"
                  rows={3}
                  value={form.notas}
                  onChange={onChange}
                />
              </label>

              <div className="modal__actions">
                <button
                  type="button"
                  className="btn-light"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

