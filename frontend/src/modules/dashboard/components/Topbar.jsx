import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

export default function Topbar({ onToggleCollapse, onToggleMobile }) {
  const { user, logout } = useAuth();

  // Nombre visible
  const displayName =
    user?.nombre_completo ||
    user?.nombre ||
    (user?.correo ? user.correo.split('@')[0] : 'Usuario');

  const initials = (displayName || 'U')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Menú: abre por hover (desktop) y por click (móvil)
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Cerrar si clic fuera o ESC
  useEffect(() => {
    const onDocClick = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

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

        {/* === Usuario + menú === */}
        <div
          ref={boxRef}
          className={`tb__user tb__user--menu ${open ? 'is-open' : ''}`}
          onMouseEnter={() => setOpen(true)}   // hover desktop
          onMouseLeave={() => setOpen(false)}  // hover desktop
        >
          <button
            className="tb__userbtn"
            onClick={() => setOpen(o => !o)}   // click/tap mobile
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <div className="tb__avatar">{initials}</div>
            <div className="tb__name">{displayName}</div>
            <svg className="tb__chev" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>

          <div className="tb__dropdown" role="menu">
            <div className="tb__userinfo" role="none">
              <div className="tb__avatar tb__avatar--sm">{initials}</div>
              <div className="tb__meta">
                <div className="tb__uname">{displayName}</div>
                <div className="tb__urole">{String(user?.rol || '').toUpperCase()}</div>
              </div>
            </div>
            <button className="tb__menuitem" role="menuitem" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


