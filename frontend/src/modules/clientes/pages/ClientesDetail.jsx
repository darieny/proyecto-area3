import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";
import { useClientes } from "../hooks/useClientes";
import "../css/Clientes.css";

export default function ClienteDetail() {
  const { id } = useParams();
  const { getCliente, updateCliente } = useClientes();

  const [cliente, setCliente] = useState(null);
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    (async () => {
      try {
        const data = await getCliente(id);
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
      } catch (e) {
        console.error("Error cargando cliente", e);
      }
    })();
  }, [id, getCliente]);

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

      // Actualiza en backend
      await updateCliente(id, payload);

      // Vuelve a leer el cliente actualizado completo
      const refreshed = await getCliente(id);
      setCliente(refreshed);

      //  Cierra modo edición
      setEdit(false);

      //  Notifica al listado general
      window.dispatchEvent(new Event("clientes:changed"));
    } catch (e) {
      console.error("No se pudo actualizar", e);
      alert("No se pudo actualizar el cliente");
    } finally {
      setSaving(false);
    }
  };

  if (!cliente)
    return (
      <div className="cliente">
        <div className="cliente__card">Cargando cliente…</div>
      </div>
    );

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Topbar />

        {/* ===== VISTA LECTURA =====*/}
        <div className="cliente">
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
                      {cliente.estado === "activo" ? "Activo" : "Inactivo"}
                    </span>
                    {cliente.nit && <span className="chip">{cliente.nit}</span>}
                    {cliente.ciudad && (
                      <span className="chip">{cliente.ciudad}</span>
                    )}
                  </div>
                </div>
                <div className="cliente__actions">
                  <Link to="/clientes" className="btn-light">
                    ← Volver
                  </Link>
                  <button className="btn-primary" onClick={() => setEdit(true)}>
                    Editar
                  </button>
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

                <div className="cliente__section">
                  <div className="dato__label">Notas</div>
                  <div className="box">{cliente.notas || "—"}</div>
                </div>
              </div>
            </section>
          )}

          {/* ===== VISTA EDICION =====*/}
          {edit && (
            <form onSubmit={onSave} className="cliente__card d-form">
              <h3>Editar cliente</h3>

              <label>
                Nombre *
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
                  name="correo"
                  type="email"
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
                <input name="ciudad" value={form.ciudad} onChange={onChange} />
              </label>
              <label>
                Dirección
                <input
                  name="direccion_linea1"
                  value={form.direccion_linea1}
                  onChange={onChange}
                />
              </label>
              <label>
                Dirección (opcional)
                <input
                  name="direccion_linea2"
                  value={form.direccion_linea2}
                  onChange={onChange}
                />
              </label>
              <label>
                NIT / Empresa
                <input name="nit" value={form.nit} onChange={onChange} />
              </label>
              <label>
                Estado
                <select name="estado" value={form.estado} onChange={onChange}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </label>

              <label className="col-span">
                Notas
                <textarea
                  name="notas"
                  rows={3}
                  value={form.notas}
                  onChange={onChange}
                />
              </label>

              <div className="d-actions">
                <button
                  type="button"
                  className="btn-light"
                  onClick={() => setEdit(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
