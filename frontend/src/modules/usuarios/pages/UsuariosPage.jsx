import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";
import { useUsuarios } from "../hooks/useUsuarios.js";
import "../css/Usuarios.css";

export default function UsuariosPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { items, roles, loading, err, create, update } = useUsuarios();

  // modal state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre_completo: "",
    correo: "",
    telefono: "",
    rol_id: "",
    password: "",
  });

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.nombre })),
    [roles]
  );

  function onNew() {
    setForm({
      nombre_completo: "",
      correo: "",
      telefono: "",
      rol_id: roleOptions[0]?.value || "",
      password: "",
    });
    setOpen(true);
  }
  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await create({
        nombre_completo: form.nombre_completo,
        correo: form.correo,
        telefono: form.telefono || null,
        rol_id: Number(form.rol_id),
        password: form.password,
      });
      setOpen(false);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      alert(msg);
    }
  }

  return (
    <div
      className={`shell ${collapsed ? "is-collapsed" : ""} ${
        mobileOpen ? "menu-open" : ""
      }`}
    >
      <Sidebar collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      <div className="main">
        <Topbar
          onMenu={() => setMobileOpen((v) => !v)}
          onCollapse={() => setCollapsed((v) => !v)}
          title="Usuarios"
        />

        <div className="card">
          <div className="row between">
            <h2>Usuarios</h2>
            <button className="btn primary" onClick={onNew}>
              Nuevo
            </button>
          </div>

          {loading && <div className="muted">Cargando…</div>}
          {err && <div className="error">{err}</div>}

          {!loading && !err && (
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Activo</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.nombre_completo}</td>
                    <td>{u.correo}</td>
                    <td>{u.telefono || "—"}</td>
                    <td>{u.rol}</td>
                    <td>
                      <span className={`chip ${u.activo ? "ok" : "off"}`}>
                        {u.activo ? "Sí" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {open && (
          <div className="modal__backdrop" onClick={() => setOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Nuevo usuario</h3>
              <form onSubmit={onSubmit} className="form">
                <label>
                  Nombre completo
                  <input
                    name="nombre_completo"
                    value={form.nombre_completo}
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
                    required
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
                  Rol
                  <select
                    name="rol_id"
                    value={form.rol_id}
                    onChange={onChange}
                    required
                  >
                    <option value="" disabled>
                      Selecciona un rol…
                    </option>
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Contraseña
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    required
                  />
                </label>

                <div className="row end gap">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn primary">
                    Guardar
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
