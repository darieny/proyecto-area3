import { useState, useEffect } from "react";

/**
 * Filtros controlados. Llama onChange con el objeto de filtros.
 * Espera props:
 *  - value: { search, tipo, prioridad, estado, from, to, page, pageSize }
 *  - onChange: fn(next)
 */
export default function VisitasFilters({ value, onChange }) {
  const [local, setLocal] = useState(value);

  useEffect(() => { setLocal(value); }, [value]);

  function setField(name, v) {
    const next = { ...local, [name]: v, page: 1 };
    setLocal(next);
    onChange(next);
  }

  return (
    <div className="filters-bar">
      <input
        className="input"
        placeholder="Buscar…"
        value={local.search || ""}
        onChange={(e) => setField("search", e.target.value)}
      />

      <select className="input" value={local.tipo || ""} onChange={(e) => setField("tipo", e.target.value)}>
        <option value="">Tipo (todos)</option>
        <option value="mantenimiento">Mantenimiento</option>
        <option value="instalacion">Instalación</option>
        <option value="soporte">Soporte</option>
        <option value="otro">Otro</option>
      </select>

      <select className="input" value={local.prioridad || ""} onChange={(e) => setField("prioridad", e.target.value)}>
        <option value="">Prioridad (todas)</option>
        <option value="baja">Baja</option>
        <option value="normal">Normal</option>
        <option value="alta">Alta</option>
        <option value="urgente">Urgente</option>
      </select>

      <select className="input" value={local.estado || ""} onChange={(e) => setField("estado", e.target.value)}>
        <option value="">Estado (todos)</option>
        <option value="programada">Programada</option>
        <option value="en_progreso">En progreso</option>
        <option value="completada">Completada</option>
        <option value="cancelada">Cancelada</option>
      </select>

      <input className="input" type="date" value={local.from || ""} onChange={(e)=>setField("from", e.target.value)} />
      <input className="input" type="date" value={local.to || ""} onChange={(e)=>setField("to", e.target.value)} />
    </div>
  );
}
