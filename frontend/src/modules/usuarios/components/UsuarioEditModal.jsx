function UsuarioEditModal({ open, onClose, userId, roles }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre_completo: "",
    correo: "",
    telefono: "",
    rol_id: "",
    activo: true,
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/usuarios/${userId}`);
        setForm({
          nombre_completo: data.nombre_completo || "",
          correo: data.correo || "",
          telefono: data.telefono || "",
          rol_id: data.rol_id || "",
          activo: !!data.activo,
        });
      } catch (e) {
        setError(e?.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, userId]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.nombre_completo.trim()) return setError("El nombre es requerido");
    if (!form.rol_id) return setError("Selecciona un rol");

    try {
      setSaving(true);
      await api.patch(`/usuarios/${userId}`, {
        nombre_completo: form.nombre_completo.trim(),
        telefono: form.telefono?.trim() || null,
        rol_id: Number(form.rol_id),
        activo: !!form.activo,
      });
      onClose?.();
      window.location.reload(); // o llama a tu hook reload
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Perfil de usuario</h3>
        {loading ? (
          <div className="muted">Cargando…</div>
        ) : (
          <form className="form" onSubmit={onSubmit}>
            <label>Nombre completo
              <input name="nombre_completo" value={form.nombre_completo} onChange={onChange} />
            </label>
            <label>Correo
              <input name="correo" value={form.correo} disabled />
            </label>
            <label>Teléfono
              <input name="telefono" value={form.telefono || ""} onChange={onChange} />
            </label>
            <label>Rol
              <select name="rol_id" value={form.rol_id} onChange={onChange} required>
                <option value="" disabled>Selecciona…</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </label>
            <label className="row" style={{ gap: 8 }}>
              <input type="checkbox" name="activo" checked={form.activo} onChange={onChange} />
              Activo
            </label>

            {error && <div className="error">{error}</div>}

            <div className="row end gap">
              <button type="button" className="btn" onClick={onClose} disabled={saving}>Cerrar</button>
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
