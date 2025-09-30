import { useAuth } from '../../../context/AuthContext';

export default function Topbar() {
  const { user } = useAuth();
  return (
    <header className="tb">
      <input className="tb__search" placeholder="Buscar" />
      <div className="tb__right">
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
