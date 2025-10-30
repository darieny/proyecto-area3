import { useState, useEffect } from "react";
import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";
import { api } from "../../../services/http";
import "../../clientes/css/Clientes.css";
import { Link } from "react-router-dom";

export default function SupervisorClientes() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tecnicos, setTecnicos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteSel, setClienteSel] = useState(null);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tecnico_asignado_id: "",
    programada_inicio: "",
    programada_fin: "",
  });
  const [saving, setSaving] = useState(false);
  const [msgError, setMsgError] = useState("");

  // cargar clientes
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/supervisor/clientes");
        setClientes(res.data.items || []);
      } catch (e) {
        setError("No se pudieron cargar los clientes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // cargar técnicos del supervisor
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/supervisor/tecnicos");
        setTecnicos(res.data.items || []);
      } catch (e) {
        console.error("Error al cargar técnicos", e);
      }
    })();
  }, []);

  const abrirModal = (cliente) => {
    setClienteSel(cliente);
    setForm({
      titulo: "",
      descripcion: "",
      tecnico_asignado_id: tecnicos[0]?.id || "",
      programada_inicio: "",
      programada_fin: "",
    });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setClienteSel(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const guardarVisita = async (e) => {
    e.preventDefault();
    setMsgError("");

    if (!form.titulo.trim()) return setMsgError("El título es requerido");
    if (!form.tecnico_asignado_id) return setMsgError("Selecciona un técnico");

    try {
      setSaving(true);
      await api.post("/supervisor/visitas", {
        cliente_id: clienteSel.id,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        tecnico_asignado_id: Number(form.tecnico_asignado_id),
        programada_inicio: form.programada_inicio || null,
        programada_fin: form.programada_fin || null,
      });

      cerrarModal();
    } catch (e) {
      const msg = e?.response?.data?.error || "Error al crear la visita";
      setMsgError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`shell ${collapsed ? "is-collapsed" : ""} ${
        mobileOpen ? "menu-open" : ""
      }`}
    >
      <Sidebar collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      <div className="main">
        <Topbar
          title="Clientes"
          onMenu={() => setMobileOpen((v) => !v)}
          onCollapse={() => setCollapsed((v) => !v)}
        />

        <div className="card">
          <h2>Clientes</h2>
          {loading && <div className="muted">Cargando...</div>}
          {error && <div className="error">{error}</div>}

          {!loading && !error && (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Ciudad / Depto</th>
                  <th>Teléfono</th>
                  <th className="tright">Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        to={`/supervisor/clientes/${c.id}`}
                        className="link-cliente"
                      >
                        {c.nombre}
                      </Link>
                    </td>
                    <td>
                      {c.ciudad || "-"} / {c.departamento || "-"}
                    </td>
                    <td>{c.telefono || "—"}</td>
                    <td className="tright">
                      <button
                        className="btn small"
                        onClick={() => abrirModal(c)}
                      >
                        Planificar visita
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal planificar */}
        {modalOpen && clienteSel && (
          <div className="modal__backdrop" onClick={cerrarModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Planificar visita</h3>
              <p className="muted">
                Cliente: <strong>{clienteSel.nombre}</strong>
              </p>

              <form onSubmit={guardarVisita} className="form">
                <label>
                  Título
                  <input
                    name="titulo"
                    value={form.titulo}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Descripción
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Técnico asignado
                  <select
                    name="tecnico_asignado_id"
                    value={form.tecnico_asignado_id}
                    onChange={handleChange}
                  >
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre_completo}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Inicio programado
                  <input
                    type="datetime-local"
                    name="programada_inicio"
                    value={form.programada_inicio}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Fin programado
                  <input
                    type="datetime-local"
                    name="programada_fin"
                    value={form.programada_fin}
                    onChange={handleChange}
                  />
                </label>

                {msgError && <div className="error">{msgError}</div>}

                <div className="row end gap">
                  <button type="button" className="btn" onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn primary"
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Guardar visita"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
