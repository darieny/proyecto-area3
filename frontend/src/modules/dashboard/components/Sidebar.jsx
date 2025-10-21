import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export default function Sidebar({ collapsed, onNavigate }) {
  const { user } = useAuth();
  const rol = String(user?.rol || '')
    .normalize('NFD').replace(/\p{Diacritic}/gu,'')
    .toLowerCase(); // "técnico" -> "tecnico"

  const linkClass = ({ isActive }) => `sb__item ${isActive ? 'active' : ''}`;

  const adminItems = (
    <>
      <NavLink to="/dashboard" className={linkClass} onClick={onNavigate}>
        <span className="dot" />
        <span className="sb__text">Dashboard</span>
      </NavLink>

      <NavLink to="/usuarios" className={linkClass} onClick={onNavigate}>
        <span className="ico">👥</span>
        <span className="sb__text">Usuarios</span>
      </NavLink>

      <NavLink to="/clientes" className={linkClass} onClick={onNavigate}>
        <span className="ico">🏪</span>
        <span className="sb__text">Clientes</span>
      </NavLink>

      <NavLink to="/visitas" className={linkClass} onClick={onNavigate}>
        <span className="ico">📋</span>
        <span className="sb__text">Visitas / Reportes</span>
      </NavLink>
    </>
  );

  const tecnicoItems = (
    <>
      <NavLink to="/tecnico" className={linkClass} onClick={onNavigate}>
        <span className="ico">📋</span>
        <span className="sb__text">Visitas / Reportes</span>
      </NavLink>
      {/* <NavLink to="/tecnico/configuracion" className={linkClass} onClick={onNavigate}>
        <span className="ico">⚙️</span>
        <span className="sb__text">Configuración</span>
      </NavLink> */}
    </>
  );

  return (
    <aside className="sb" aria-label="Menú lateral">
      <div className="sb__logo">{collapsed ? 'L' : 'logo'}</div>

      <nav className="sb__section">
        <div className="sb__title">MENÚ</div>
        {rol === 'tecnico' ? tecnicoItems : adminItems}
      </nav>

      <nav className="sb__section mt">
        <div className="sb__title">OTROS</div>
        <button className="sb__item" type="button" onClick={onNavigate}>
          <span className="ico">⚙️</span>
          <span className="sb__text">Configuración</span>
        </button>
      </nav>
    </aside>
  );
}


