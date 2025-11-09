import { useMemo, useState, useEffect } from "react";
import Sidebar from "../../dashboard/components/Sidebar";
import Topbar from "../../dashboard/components/Topbar";
import { useUsuarios } from "../hooks/useUsuarios.js";
import { api } from "../../../services/http.js";
import "../css/Usuarios.css";

export default function UsuariosPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { items, roles, loading, err, create, update, reload } = useUsuarios();

  // ====== Supervisores (para asignar a técnicos) ======
  const [supervisores, setSupervisores] = useState([]);

  useEffect(() => {
    api.get("/usuarios/supervisores")
      .then(res => setSupervisores(res.data || []))
      .catch(() => setSupervisores([]));
  }, []);

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
    supervisor_id: "",
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
      supervisor_id: "",
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

    if (!form.nombre_completo.trim()) return setFormError("El nombre es requerido");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) return setFormError("Correo inválido");
    if (!form.rol_id) return setFormError("Selecciona un rol");
    if (!form.password || form.password.length < 6)
      return setFormError("La contraseña debe tener al menos 6 caracteres");

    try {
      setSaving(true);
      await create({
        nombre_completo: form.nombre_completo.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim() || null,
        rol_id: Number(form.rol_id),
        password: form.password,
        supervisor_id: form.supervisor_id ? Number(form.supervisor_id) : null,
      });
      setOpen(false);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  // ===== Modal Editar / Perfil =====
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({
    id: 0,
    nombre_completo: "",
    correo: "",
    telefono: "",
    rol_id: "",
    activo: true,
    supervisor_id: "",
  });

  function openEdit(u) {
    setSelected(u);
    setEditForm({
      id: u.id,
      nombre_completo: u.nombre_completo || "",
      correo: u.correo || "",
      telefono: u.telefono || "",
      rol_id: u.rol_id || "",
      activo: !!u.activo,
      supervisor_id: u.supervisor_id || "",
    });
    setEditErr("");
    setEditOpen(true);
  }

  function onEditChange(e) {
    const { name, value, type, checked } = e.target;
    setEditForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function onEditSubmit(e) {
    e.preventDefault();
    setEditErr("");
    if (!editForm.nombre_completo.trim()) return setEditErr("El nombre es requerido");
    if (!editForm.rol_id) return setEditErr("Selecciona un rol");

    try {
      setEditSaving(true);
      await update(editForm.id, {
        nombre_completo: editForm.nombre_completo.trim(),
        telefono: editForm.telefono?.trim() || null,
        rol_id: Number(editForm.rol_id),
        activo: !!editForm.activo,
        supervisor_id: editForm.supervisor_id ? Number(editForm.supervisor_id) : null, // 👈 agregado
      });
      setEditOpen(false);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      setEditErr(msg);
    } finally {
      setEditSaving(false);
    }
  }

  // ===== Eliminar (soft delete) =====
  async function onDelete(u) {
    if (!window.confirm(`¿Eliminar (desactivar) a "${u.nombre_completo}"?`)) return;
    await api.delete(`/usuarios/${u.id}`);
    await reload();
  }


  // =======================  UI  ===============================

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
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Activo</th>
                    <th className="tright">Acciones</th>
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
                      <td className="tright">
                        <button className="btn small" onClick={() => openEdit(u)}>
                          Ver / Editar
                        </button>
                        <button
                          className="btn small danger"
                          onClick={() => onDelete(u)}
                          style={{ marginLeft: 8 }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <input name="telefono" value={form.telefono} onChange={onChange} />
                </label>
                <label>
                  Rol
                  <select name="rol_id" value={form.rol_id} onChange={onChange} required>
                    <option value="" disabled>Selecciona un rol…</option>
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </label>

                {/* Mostrar select de supervisor solo si el rol es técnico */}
                {roles.find(r => r.id === Number(form.rol_id))?.nombre === "tecnico" && (
                  <label>
                    Supervisor
                    <select
                      name="supervisor_id"
                      value={form.supervisor_id || ""}
                      onChange={onChange}
                      required
                    >
                      <option value="">Selecciona un supervisor…</option>
                      {supervisores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

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
                  <button type="button" className="btn" onClick={() => setOpen(false)} disabled={saving}>
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

        {/* ===== Modal Ver / Editar Usuario ===== */}
        {editOpen && selected && (
          <div className="modal__backdrop" onClick={() => setEditOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Perfil de usuario</h3>
              <form onSubmit={onEditSubmit} className="form">
                <label>
                  Nombre completo
                  <input
                    name="nombre_completo"
                    value={editForm.nombre_completo}
                    onChange={onEditChange}
                    required
                  />
                </label>
                <label>
                  Correo
                  <input name="correo" value={editForm.correo} disabled />
                </label>
                <label>
                  Teléfono
                  <input
                    name="telefono"
                    value={editForm.telefono || ""}
                    onChange={onEditChange}
                  />
                </label>
                <label>
                  Rol
                  <select
                    name="rol_id"
                    value={editForm.rol_id}
                    onChange={onEditChange}
                    required
                  >
                    <option value="" disabled>Selecciona…</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </label>

                {/* Select de supervisor si el rol es técnico */}
                {roles.find(r => r.id === Number(editForm.rol_id))?.nombre === "tecnico" && (
                  <label>
                    Supervisor
                    <select
                      name="supervisor_id"
                      value={editForm.supervisor_id || ""}
                      onChange={onEditChange}
                    >
                      <option value="">Selecciona un supervisor…</option>
                      {supervisores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="row" style={{ gap: 8 }}>
                  <input
                    type="checkbox"
                    name="activo"
                    checked={!!editForm.activo}
                    onChange={onEditChange}
                  />
                  Activo
                </label>

                {editErr && <div className="error">{editErr}</div>}

                <div className="row end gap">
                  <button type="button" className="btn" onClick={() => setEditOpen(false)} disabled={editSaving}>
                    Cerrar
                  </button>
                  <button type="submit" className="btn primary" disabled={editSaving}>
                    {editSaving ? "Guardando…" : "Guardar cambios"}
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



