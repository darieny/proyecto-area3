import { useMemo, useState } from "react";
import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";
import { useUsuarios } from "../hooks/useUsuarios.js";
import "../css/Usuarios.css";

export default function UsuariosPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { items, roles, loading, err, create } = useUsuarios();

  // ===== Modal Crear =====
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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
    setFormError("");
    setOpen(true);
  }
  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");

    // Validaciones rápidas
    if (!form.nombre_completo.trim()) return setFormError("El nombre es requerido");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) return setFormError("Correo inválido");
    if (!form.rol_id) return setFormError("Selecciona un rol");
    if (!form.password || form.password.length < 6) return setFormError("La contraseña debe tener al menos 6 caracteres");

    try {
      setSaving(true);
      await create({
        nombre_completo: form.nombre_completo.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim() || null,
        rol_id: Number(form.rol_id),
        password: form.password,
      });
      setOpen(false);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`shell ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "menu-open" : ""}`}>
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
            <button className="btn primary" onClick={onNew}>+ Crear</button>
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

        {/* ===== Modal Crear Usuario ===== */}
        {open && (
          <div className="modal__backdrop" onClick={() => setOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Crear usuario</h3>
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
                    <option value="" disabled>Selecciona un rol…</option>
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
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

                {formError && <div className="error">{formError}</div>}

                <div className="row end gap">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setOpen(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn primary" disabled={saving}>
                    {saving ? "Guardando…" : "Guardar"}
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

