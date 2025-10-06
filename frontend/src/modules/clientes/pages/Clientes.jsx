import { useState, useMemo } from "react";
import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";
import { useClientes } from "../hooks/useClientes.js";
import ClienteKpis from "../components/ClienteKpis";
import ClientesTable from "../components/ClientesTable";
import { api } from "../../../services/http.js";
import ModalPortal from "../../clientes/components/ModalPortal.jsx";
import "../css/Clientes.css";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { PlaceAutocompleteElement } from "@googlemaps/extended-component-library/places";

const PAGE_SIZE = 10;
const DEFAULT_CENTER = { lat: 14.6349, lng: -90.5069 }; // Ciudad de Guatemala

// evita recargar el loader
const LIBRARIES = ["places"];

export default function ClientesPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("recientes");
  const [page, setPage] = useState(1);

  const [refreshTick, setRefreshTick] = useState(0);

  const { kpis, items, meta, loading, err } = useClientes({
    search, order, page, pageSize: PAGE_SIZE, refreshTick,
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
    direccion_linea1: "",
    direccion_linea2: "",

    // Ubicación principal
    ubi_etiqueta: "Principal",
    ubi_cp: "",
    ubi_notas: "",
    latitud: null,
    longitud: null,
    place_id: null,
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
      direccion_linea1: "",
      direccion_linea2: "",
      ubi_etiqueta: "Principal",
      ubi_cp: "",
      ubi_notas: "",
      latitud: null,
      longitud: null,
      place_id: null,
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

      // 1) Crear cliente
      const { data: nuevo } = await api.post("/clientes", {
        nombre: form.nombre.trim(),
        correo: form.correo || null,
        telefono: form.telefono || null,
        nit: form.nit || null,
        ciudad: form.ciudad || null,
        departamento: form.departamento || null,
        notas: form.notas || null,
        estado: form.estado || "activo",
        direccion_linea1: form.direccion_linea1 || null,
        direccion_linea2: form.direccion_linea2 || null,
      });

      // 2) Crear ubicación principal (si hay coords)
      if (nuevo?.id && form.latitud != null && form.longitud != null) {
        await api.post("/ubicaciones", {
          cliente_id: nuevo.id,
          etiqueta: form.ubi_etiqueta || "Principal",
          direccion_linea1: form.direccion_linea1 || null,
          direccion_linea2: form.direccion_linea2 || null,
          ciudad: form.ciudad || null,
          departamento: form.departamento || null,
          codigo_postal: form.ubi_cp || null,
          latitud: form.latitud,
          longitud: form.longitud,
          place_id: form.place_id || null,
          notas: form.ubi_notas || null,
        });
      }

      setShowModal(false);
      setPage(1);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      console.error("Error creando cliente", err);
      alert("No se pudo crear el cliente");
    } finally {
      setSaving(false);
    }
  }

  // ====== Google Maps Loader (una sola vez) ======
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  // Evita recrear el center objeto (render suave)
  const mapCenter = useMemo(
    () => ({
      lat: form.latitud ?? DEFAULT_CENTER.lat,
      lng: form.longitud ?? DEFAULT_CENTER.lng,
    }),
    [form.latitud, form.longitud]
  );

  return (
    <div className={`shell ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "menu-open" : ""}`}>
      <Sidebar collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      <main className="main">
        <Topbar
          onToggleCollapse={() => setCollapsed(v => !v)}
          onToggleMobile={() => setMobileOpen(v => !v)}
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
                    <button className="btn-primary" onClick={openModal}>
                      + Agregar Cliente
                    </button>

                    <div className="input-search">
                      <span className="ico">🔍</span>
                      <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                        <button onClick={() => setOrder("recientes")}>Recientes</button>
                        <button onClick={() => setOrder("nombre_asc")}>Nombre (A–Z)</button>
                        <button onClick={() => setOrder("nombre_desc")}>Nombre (Z–A)</button>
                      </div>
                    </div>
                  </div>
                </header>

                <ClientesTable items={items} />

                <footer className="pager">
                  <button disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>‹</button>

                  {[...Array(Math.min(5, meta.totalPages))].map((_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        className={p === meta.page ? "is-active" : ""}
                        onClick={() => setPage(p)}
                      >{p}</button>
                    );
                  })}

                  {meta.totalPages > 5 && (
                    <>
                      <span className="ellipsis">…</span>
                      <button
                        className={meta.page === meta.totalPages ? "is-active" : ""}
                        onClick={() => setPage(meta.totalPages)}
                      >{meta.totalPages}</button>
                    </>
                  )}

                  <button
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage(meta.page + 1)}
                  >›</button>
                </footer>
              </section>
            </>
          )}
        </div>
      </main>

      {/* ===== Modal (en portal) ===== */}
      <ModalPortal open={showModal} onClose={() => setShowModal(false)}>
            <header className="m-head">
              <div className="m-head__left">
                <span className="m-head__icon">🧾</span>
                <h3>Agregar nuevo cliente</h3>
              </div>
              <button className="m-close" aria-label="Cerrar" onClick={() => setShowModal(false)}>×</button>
            </header>

            <form onSubmit={handleCreate} className="m-form">
              <label className="field full">
                <span className="field__label">Nombre *</span>
                <div className="field__control">
                  <input name="nombre" value={form.nombre} onChange={onChange} required placeholder="Ej: Farmacia La Fe" />
                </div>
              </label>

              <label className="field half">
                <span className="field__label">Correo</span>
                <div className="field__control">
                  <input name="correo" type="email" value={form.correo} onChange={onChange} placeholder="correo@ejemplo.com" />
                </div>
              </label>

              <label className="field half">
                <span className="field__label">Teléfono</span>
                <div className="field__control">
                  <input name="telefono" value={form.telefono} onChange={onChange} placeholder="5555-0000" />
                </div>
              </label>

              <label className="field full">
                <span className="field__label">Dirección</span>
                <div className="field__control">
                  <input name="direccion_linea1" value={form.direccion_linea1} onChange={onChange} placeholder="Calle y número" />
                </div>
              </label>

              <label className="field full">
                <span className="field__label">Dirección (opcional)</span>
                <div className="field__control">
                  <input name="direccion_linea2" value={form.direccion_linea2} onChange={onChange} placeholder="Colonia, referencia, etc." />
                </div>
              </label>

              <label className="field half">
                <span className="field__label">Ciudad</span>
                <div className="field__control">
                  <input name="ciudad" value={form.ciudad} onChange={onChange} placeholder="Ej: Chiquimula" />
                </div>
              </label>

              <label className="field half">
                <span className="field__label">Departamento</span>
                <div className="field__control">
                  <input name="departamento" value={form.departamento} onChange={onChange} placeholder="Ej: Guatemala" />
                </div>
              </label>

              <label className="field half">
                <span className="field__label">NIT / Empresa</span>
                <div className="field__control">
                  <input name="nit" value={form.nit} onChange={onChange} placeholder="NIT o nombre de empresa" />
                </div>
              </label>

              <label className="field half">
                <span className="field__label">Estado</span>
                <div className="field__control">
                  <select name="estado" value={form.estado} onChange={onChange}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </label>

              <label className="field full">
                <span className="field__label">Observaciones</span>
                <div className="field__control">
                  <textarea name="notas" rows={4} value={form.notas} onChange={onChange} placeholder="Notas u observaciones del cliente" />
                </div>
              </label>

          {/* ====== Autocomplete ====== */}
          <label className="field full">
            <span className="field__label">Buscar y seleccionar en el mapa</span>
            <div className="field__control">
              {isLoaded && (
                <PlaceAutocompleteElement
                  // Evita re-montajes
                  style={{ width: "100%", borderRadius: 10, padding: "4px 0" }}
                  placeholder="Buscar dirección, negocio, etc."
                  onPlaceChanged={(e) => {
                    // e.detail contiene el PlaceResult
                    const place = e?.detail;
                    const loc = place?.geometry?.location;
                    setForm((f) => ({
                      ...f,
                      direccion_linea1: f.direccion_linea1 || place?.formatted_address || place?.name || "",
                      latitud: loc ? loc.lat() : f.latitud,
                      longitud: loc ? loc.lng() : f.longitud,
                      place_id: place?.place_id || f.place_id,
                    }));
                  }}
                />
              )}
            </div>
          </label>

          {/* ====== Mapa ====== */}
          <label className="field full">
            <span className="field__label">Ubicación del cliente</span>
            <div style={{ height: 260, borderRadius: 10, overflow: "hidden" }}>
              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={mapCenter}
                  zoom={form.latitud ? 16 : 12}
                  options={{ streetViewControl: false, mapTypeControl: false }}
                  onClick={(e) =>
                    setForm((f) => ({
                      ...f,
                      latitud: e.latLng.lat(),
                      longitud: e.latLng.lng(),
                    }))
                  }
                >
                  {form.latitud != null && form.longitud != null && (
                    <Marker
                      position={{ lat: form.latitud, lng: form.longitud }}
                      draggable
                      onDragEnd={(e) =>
                        setForm((f) => ({
                          ...f,
                          latitud: e.latLng.lat(),
                          longitud: e.latLng.lng(),
                        }))
                      }
                    />
                  )}
                </GoogleMap>
              )}
            </div>
            {form.latitud != null && form.longitud != null && (
              <small style={{ color: "#475569" }}>
                Coordenadas: {form.latitud.toFixed(6)}, {form.longitud.toFixed(6)}
              </small>
            )}
          </label>

              {/* Meta de ubicación */}
              <label className="field half">
                <span className="field__label">Etiqueta de ubicación</span>
                <div className="field__control">
                  <input
                    name="ubi_etiqueta"
                    value={form.ubi_etiqueta}
                    onChange={onChange}
                    placeholder="Principal / Sucursal / Bodega"
                  />
                </div>
              </label>

              <label className="field half">
                <span className="field__label">Código Postal</span>
                <div className="field__control">
                  <input
                    name="ubi_cp"
                    value={form.ubi_cp}
                    onChange={onChange}
                    placeholder="Opcional"
                  />
                </div>
              </label>

              <label className="field full">
                <span className="field__label">Notas de ubicación</span>
                <div className="field__control">
                  <textarea
                    name="ubi_notas"
                    rows={2}
                    value={form.ubi_notas}
                    onChange={onChange}
                    placeholder="Indicaciones de acceso, referencias, etc."
                  />
                </div>
              </label>

              <div className="m-actions full">
            <button type="button" className="btn-light" onClick={() => setShowModal(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Guardando…" : "Guardar cliente"}
            </button>
          </div>
        </form>
      </ModalPortal>
    </div>
  );
}

