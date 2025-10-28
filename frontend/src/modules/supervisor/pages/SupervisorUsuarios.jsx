import { useState } from 'react';
import Sidebar from '../../dashboard/components/Sidebar';
import Topbar from '../../dashboard/components/Topbar';
import { useSupervisorTecnicos } from '../hooks/useSupervisorTecnicos';
import '../../usuarios/css/Usuarios.css';

export default function SupervisorUsuarios() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items, loading, err } = useSupervisorTecnicos();

  return (
    <div className={`shell ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'menu-open' : ''}`}>
      <Sidebar collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />

      <div className="main">
        <Topbar
          onMenu={() => setMobileOpen(v => !v)}
          onCollapse={() => setCollapsed(v => !v)}
          title="Usuarios (mi equipo)"
        />

        <div className="card">
          <div className="row between">
            <h2>Mi equipo</h2>
            {/* Supervisor no crea/borra usuarios */}
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
                    <th>Código técnico</th>
                    <th>Activo</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.nombre_completo}</td>
                      <td>{u.correo}</td>
                      <td>{u.codigo || '—'}</td>
                      <td>
                        <span className={`chip ${u.activo ? 'ok' : 'off'}`}>
                          {u.activo ? 'Sí' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!items.length && (
                    <tr>
                      <td colSpan={5} className="muted tright">
                        Sin técnicos asignados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

