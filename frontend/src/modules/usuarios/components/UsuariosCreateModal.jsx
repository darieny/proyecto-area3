import { useState, useEffect } from "react";

export default function UsuariosCreateModal({ open, onClose, onCreate, roleOptions }) {
  const [form, setForm] = useState({
    nombre_completo: "",
    correo: "",
    telefono: "",
    rol_id: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        nombre_completo: "",
        correo: "",
        telefono: "",
        rol_id: roleOptions[0]?.value || "",
        password: "",
      });
      setError("");
      setSaving(false);
    }
  }, [open, roleOptions]);

  if (!open) return null;

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    // validaciones rápidas
    if (!form.nombre_completo?.trim()) return setError("El nombre es requerido");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) return setError("Correo inválido");
    if (!form.rol_id) return setError("Selecciona un rol");
    if (!form.password || form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");

    try {
      setSaving(true);
      await onCreate({
        nombre_completo: form.nombre_completo.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim() || null,
        rol_id: Number(form.rol_id),
        password: form.password,
      });
      onClose?.();
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Crear usuario</h3>
        <form className="form" onSubmit={onSubmit}>
          <label>Nombre completo
            <input name="nombre_completo" value={form.nombre_completo} onChange={onChange} required />
          </label>
          <label>Correo
            <input type="email" name="correo" value={form.correo} onChange={onChange} required />
          </label>
          <label>Teléfono
            <input name="telefono" value={form.telefono} onChange={onChange} />
          </label>
          <label>Rol
            <select name="rol_id" value={form.rol_id} onChange={onChange} required>
              <option value="" disabled>Selecciona un rol…</option>
              {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
          <label>Contraseña
            <input type="password" name="password" value={form.password} onChange={onChange} required />
          </label>

          {error && <div className="error">{error}</div>}

          <div className="row end gap">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
