import { useAuth } from '../../../context/AuthContext';

export default function Topbar({ onToggleCollapse, onToggleMobile }) {
  const { user } = useAuth();

  return (
    <header className="tb">
      {/* botón hamburguesa (visible/útil en móvil) */}
      <button
        className="tb__icon"
        aria-label="Abrir menú"
        onClick={onToggleMobile}
        title="Menú"
      >
        ☰
      </button>

      <input className="tb__search" placeholder="Buscar" />

      <div className="tb__right">
        {/* botón colapsar (desktop) */}
        <button
          className="tb__icon"
          aria-label="Colapsar menú"
          onClick={onToggleCollapse}
          title="Colapsar/expandir menú"
        >
          ↔
        </button>

        <button className="tb__icon" title="Notificaciones">🔔</button>
        <button className="tb__icon" title="Mensajes">💬</button>

        <div className="tb__user">
          <div className="tb__avatar">{(user?.nombre_completo || 'A')[0]}</div>
          <div className="tb__name">{user?.nombre_completo || 'Usuario'}</div>
        </div>
      </div>
    </header>
  );
}

