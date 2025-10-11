import { NavLink } from 'react-router-dom';

export default function Sidebar({ collapsed, onNavigate }) {
  const linkClass = ({ isActive }) =>
    `sb__item ${isActive ? 'active' : ''}`;

  return (
    <aside className="sb" aria-label="Menú lateral">
      <div className="sb__logo">{collapsed ? 'L' : 'logo'}</div>

      <nav className="sb__section">
        <div className="sb__title">MENÚ</div>

        <NavLink to="/dashboard" className={linkClass} onClick={onNavigate}>
          <span className="dot" />
          <span className="sb__text">Dashboard</span>
        </NavLink>

        <button className="sb__item" type="button" onClick={onNavigate}>
          <span className="ico">👥</span>
          <span className="sb__text">Usuarios</span>
        </button>

        <NavLink to="/clientes" className={linkClass}>
          <span className="ico">🏪</span>
          <span className="sb__text">Clientes</span>
        </NavLink>

        <NavLink to="/visitas" className={linkClass}>
          <span className="ico">📊</span>
          <span className="sb__text">Visitas / Reportes</span>
          </NavLink>
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

