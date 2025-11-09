import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";
import { useClientes } from "../hooks/useClientes";
import "../css/Clientes.css";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import VisitaFormModal from "../../visitas/components/VisitaFormModal";
import { useVisitas } from "../../visitas/hooks/useVisitas.js";
import ClienteVisitasWidget from "../../visitas/components/ClienteVisitasWidget.jsx";
import { api } from "../../../services/http.js";

const DEFAULT_CENTER = { lat: 14.6349, lng: -90.5069 }; // Guatemala
const LIBRARIES = ["places"];

export default function ClienteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCliente, updateCliente, getUbicacionPrincipal } = useClientes();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [cliente, setCliente] = useState(null);
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [openVisita, setOpenVisita] = useState(false);

  const [coords, setCoords] = useState(null);
  const [placeLabel, setPlaceLabel] = useState("");
  const [ubicacionId, setUbicacionId] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    departamento: "",
    ciudad: "",
    notas: "",
    nit: "",
    direccion_linea1: "",
    direccion_linea2: "",
    estado: "activo",
  });

  // últimas visitas (5)
  const {
    items: visitasCliente,
    loading: loadingVisitas,
    filters: visitasFilters,
    setFilters: setVisitasFilters,
  } = useVisitas({ cliente_id: id, page: 1, pageSize: 5 });

  // Cargar cliente + ubicación
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getCliente(id);
        if (!alive) return;

        setCliente(data);
        setForm({
          nombre: data.nombre ?? "",
          correo: data.correo ?? "",
          telefono: data.telefono ?? "",
          departamento: data.departamento ?? "",
          ciudad: data.ciudad ?? "",
          notas: data.notas ?? "",
          nit: data.nit ?? "",
          direccion_linea1: data.direccion_linea1 ?? "",
          direccion_linea2: data.direccion_linea2 ?? "",
          estado: data.estado ?? "activo",
        });

        if (data.latitud != null && data.longitud != null) {
          setCoords({ lat: Number(data.latitud), lng: Number(data.longitud) });
          setPlaceLabel(data.direccion_linea1 || data.nombre || "Ubicación");
        } else {
          const u = await getUbicacionPrincipal(id);
          if (!alive) return;

          if (u?.latitud != null && u?.longitud != null) {
            setCoords({ lat: Number(u.latitud), lng: Number(u.longitud) });
            setPlaceLabel(
              u.direccion_linea1 || u.etiqueta || "Ubicación principal"
            );
            setUbicacionId(u.id);
          } else {
            setCoords(null);
          }
        }
      } catch (e) {
        if (alive) {
          console.error("Error cargando cliente", e);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, getCliente, getUbicacionPrincipal]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        nombre: form.nombre.trim(),
        correo: form.correo || null,
        telefono: form.telefono || null,
        departamento: form.departamento || null,
        ciudad: form.ciudad || null,
        notas: form.notas || null,
        nit: form.nit || null,
        direccion_linea1: form.direccion_linea1 || null,
        direccion_linea2: form.direccion_linea2 || null,
        estado: form.estado || "activo",
      };

      await updateCliente(id, payload);
      const refreshed = await getCliente(id);
      setCliente(refreshed);
      setEdit(false);
      setPlaceLabel(refreshed.direccion_linea1 || placeLabel);
      window.dispatchEvent(new Event("clientes:changed"));
    } catch (e) {
      console.error("No se pudo actualizar", e);
      alert("No se pudo actualizar el cliente");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar cliente
  async function onDelete() {
    const ok = window.confirm(
      "¿Eliminar este cliente y todos sus datos asociados? Esta acción no se puede deshacer."
    );
    if (!ok) return;
    try {
      await api.delete(`/clientes/${id}`);
      alert("Cliente eliminado correctamente.");
      navigate("/clientes");
    } catch (e) {
      const msg =
        e?.response?.data?.error || "No se pudo eliminar el cliente.";
      alert(msg);
      console.error(e);
    }
  }

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  const center = useMemo(
    () => (coords ? coords : DEFAULT_CENTER),
    [coords]
  );

  if (!cliente) {
    return (
      <div className="shell">
        <Sidebar />
        <main className="main">
          <Topbar />
          <div className="cliente__card">Cargando cliente…</div>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`shell ${collapsed ? "is-collapsed" : ""} ${
        mobileOpen ? "menu-open" : ""
      }`}
    >
      <Sidebar
        collapsed={collapsed}
        onNavigate={() => setMobileOpen(false)}
      />
      <main className="main">
        <Topbar
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onToggleMobile={() => setMobileOpen((v) => !v)}
        />

        <div className="cliente">
          {/* ===== Vista lectura ===== */}
          {!edit && (
            <section className="cliente__card">
              <header className="cliente__header">
                <div>
                  <h2 className="cliente__title">{cliente.nombre}</h2>
                  <div className="cliente__meta">
                    <span
                      className={`pill ${
                        cliente.estado === "activo" ? "ok" : "bad"
                      }`}
                    >
                      {cliente.estado === "activo"
                        ? "Activo"
                        : "Inactivo"}
                    </span>
                    {cliente.nit && (
                      <span className="chip">{cliente.nit}</span>
                    )}
                    {cliente.ciudad && (
                      <span className="chip">
                        {cliente.ciudad}
                      </span>
                    )}
                  </div>
                </div>
                <div className="cliente__actions">
                  <Link to="/clientes" className="btn-light">
                    ← Volver
                  </Link>
                  <button
                    className="btn-primary"
                    onClick={() => setOpenVisita(true)}
                  >
                    Nueva visita
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setEdit(true)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn danger"
                    onClick={onDelete}
                  >
                    Eliminar cliente
                  </button>
                </div>
              </header>

              <div className="cliente__grid">
                <div className="dato">
                  <div className="dato__label">Correo</div>
                  <div className="dato__value">
                    {cliente.correo || "—"}
                  </div>
                </div>
                <div className="dato">
                  <div className="dato__label">Teléfono</div>
                  <div className="dato__value">
                    {cliente.telefono || "—"}
                  </div>
                </div>
                <div className="dato">
                  <div className="dato__label">
                    Departamento
                  </div>
                  <div className="dato__value">
                    {cliente.departamento || "—"}
                  </div>
                </div>
                <div className="dato">
                  <div className="dato__label">Dirección</div>
                  <div className="dato__value">
                    {cliente.direccion_linea1 || "—"}
                  </div>
                </div>

                {coords && (
                  <div className="cliente__section">
                    <div className="dato__label">Ubicación</div>
                    <div
                      style={{
                        height: 280,
                        borderRadius: 12,
                        overflow: "hidden",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {isLoaded ? (
                        <GoogleMap
                          mapContainerStyle={{
                            width: "100%",
                            height: "100%",
                          }}
                          center={center}
                          zoom={16}
                          options={{
                            streetViewControl: false,
                            mapTypeControl: false,
                          }}
                        >
                          <Marker
                            position={coords}
                            title={
                              placeLabel || cliente.nombre
                            }
                          />
                        </GoogleMap>
                      ) : (
                        <div className="box">
                          Cargando mapa…
                        </div>
                      )}
                    </div>
                    <small style={{ color: "#64748b" }}>
                      Coordenadas:{" "}
                      {coords.lat.toFixed(6)},{" "}
                      {coords.lng.toFixed(6)}
                    </small>
                  </div>
                )}

                {/* Últimas visitas */}
                <ClienteVisitasWidget
                  items={visitasCliente}
                  loading={loadingVisitas}
                  onVerTodas={() =>
                    navigate(`/visitas?cliente_id=${id}`)
                  }
                />
              </div>
            </section>
          )}

          {/* ===== Vista edición ===== */}
          {edit && (
            <section className="cliente__card">
              <header className="cliente__header">
                <h2>Editar cliente</h2>
              </header>
              <form className="form" onSubmit={onSave}>
                <label>
                  Nombre
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={onChange}
                    required
                  />
                </label>
                <label>
                  Correo
                  <input
                    type="email"
                    name="correo"
                    value={form.correo}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Teléfono
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Departamento
                  <input
                    name="departamento"
                    value={form.departamento}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Ciudad
                  <input
                    name="ciudad"
                    value={form.ciudad}
                    onChange={onChange}
                  />
                </label>
                <label>
                  NIT
                  <input
                    name="nit"
                    value={form.nit}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Dirección línea 1
                  <input
                    name="direccion_linea1"
                    value={form.direccion_linea1}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Dirección línea 2
                  <input
                    name="direccion_linea2"
                    value={form.direccion_linea2}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Notas
                  <textarea
                    name="notas"
                    value={form.notas}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Estado
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={onChange}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">
                      Inactivo
                    </option>
                  </select>
                </label>

                <div className="row end gap">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setEdit(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn primary"
                    disabled={saving}
                  >
                    {saving
                      ? "Guardando…"
                      : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        {/* Modal para crear visita */}
        <VisitaFormModal
          open={openVisita}
          onClose={() => setOpenVisita(false)}
          clienteId={cliente.id}
          prefill={{
            direccion: cliente.direccion_linea1,
            telefono: cliente.telefono,
            ubicacionId: ubicacionId,
          }}
          onSaved={() =>
            setVisitasFilters({ ...visitasFilters })
          }
        />
      </main>
    </div>
  );
}





