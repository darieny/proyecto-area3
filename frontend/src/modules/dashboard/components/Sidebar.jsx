import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="sb">
      <div className="sb__logo">logo</div>

      <nav className="sb__section">
        <div className="sb__title">MENÚ</div>
        <NavLink to="/dashboard" className="sb__item">
          <span className="dot" /> Dashboard
        </NavLink>
        <button className="sb__item" type="button">
          <span className="ico">👥</span> Usuarios
        </button>
        <button className="sb__item" type="button">
          <span className="ico">🏪</span> Clientes
        </button>
        <button className="sb__item" type="button">
          <span className="ico">📊</span> Visitas / Reportes
        </button>
      </nav>

      <nav className="sb__section mt">
        <div className="sb__title">OTROS</div>
        <button className="sb__item" type="button">
          <span className="ico">⚙️</span> Configuración
        </button>
      </nav>
    </aside>
  );
}
