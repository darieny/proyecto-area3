import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";
import { api } from "../../../services/http";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import "../../clientes/css/Clientes.css";

const DEFAULT_CENTER = { lat: 14.6349, lng: -90.5069 }; // Guatemala
const LIBRARIES = ["places"];

export default function SupervisorClienteDetail() {
  const { id } = useParams();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [cliente, setCliente] = useState(null);
  const [coords, setCoords] = useState(null);
  const [placeLabel, setPlaceLabel] = useState("");

  const GOOGLE_KEY =
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_GOOGLE_MAPS_KEY) ||
    process.env.REACT_APP_GOOGLE_MAPS_KEY ||
    "";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_KEY,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Detalle del cliente (solo lectura)
        const { data: c } = await api.get(`/supervisor/clientes/${id}`);
        if (!alive) return;
        setCliente(c);

        // Coordenadas: del cliente o de su ubicación principal
        if (c?.latitud != null && c?.longitud != null) {
          setCoords({ lat: Number(c.latitud), lng: Number(c.longitud) });
          setPlaceLabel(c.direccion_linea1 || c.nombre || "Ubicación");
        } else {
          const { data: u } = await api.get(`/supervisor/clientes/${id}/ubicacion-principal`);
          if (u?.latitud != null && u?.longitud != null) {
            setCoords({ lat: Number(u.latitud), lng: Number(u.longitud) });
            setPlaceLabel(u.direccion_linea1 || u.etiqueta || "Ubicación principal");
          } else {
            setCoords(null);
          }
        }
      } catch (e) {
        console.error("No se pudo cargar cliente (supervisor)", e);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const center = useMemo(() => (coords ? coords : DEFAULT_CENTER), [coords]);

  if (!cliente) {
    return (
      <div className="shell">
        <Sidebar />
        <main className="main"><div className="cliente__card">Cargando…</div></main>
      </div>
    );
  }

  return (
    <div className={`shell ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "menu-open" : ""}`}>
      <Sidebar collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      <main className="main">
        <Topbar
          title="Detalle de cliente"
          onMenu={() => setMobileOpen(v => !v)}
          onCollapse={() => setCollapsed(v => !v)}
        />

        <div className="cliente">
          <section className="cliente__card">
            <header className="cliente__header">
              <div>
                <h2 className="cliente__title">{cliente.nombre}</h2>
                <div className="cliente__meta">
                  <span className={`pill ${cliente.estado === "activo" ? "ok" : "bad"}`}>
                    {cliente.estado === "activo" ? "Activo" : "Inactivo"}
                  </span>
                  {cliente.nit && <span className="chip">{cliente.nit}</span>}
                  {cliente.ciudad && <span className="chip">{cliente.ciudad}</span>}
                </div>
              </div>
              <div className="cliente__actions">
                <Link to="/supervisor/clientes" className="btn-light">← Volver</Link>
              </div>
            </header>

            <div className="cliente__grid">
              <div className="dato">
                <div className="dato__label">Correo</div>
                <div className="dato__value">{cliente.correo || "—"}</div>
              </div>
              <div className="dato">
                <div className="dato__label">Teléfono</div>
                <div className="dato__value">{cliente.telefono || "—"}</div>
              </div>
              <div className="dato">
                <div className="dato__label">Departamento</div>
                <div className="dato__value">{cliente.departamento || "—"}</div>
              </div>
              <div className="dato">
                <div className="dato__label">Dirección</div>
                <div className="dato__value">{cliente.direccion_linea1 || "—"}</div>
              </div>

              {coords && (
                <div className="cliente__section">
                  <div className="dato__label">Ubicación</div>
                  <div style={{ height: 280, borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                    {isLoaded ? (
                      <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "100%" }}
                        center={center}
                        zoom={16}
                        options={{ streetViewControl: false, mapTypeControl: false }}
                      >
                        <Marker position={coords} title={placeLabel || cliente.nombre} />
                      </GoogleMap>
                    ) : (
                      <div className="box">Cargando mapa…</div>
                    )}
                  </div>
                  <small style={{ color: "#64748b" }}>
                    Coordenadas: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </small>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

