import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const u = await login(correo, password);
      if (u?.must_change_password) nav('/cambiar-password');
      else nav('/');
    } catch (e) {
      setErr(e.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-bg">
      <form className="login-stack" onSubmit={onSubmit}>

        {/* Icono carrito */}
        <div className="login-icon" aria-hidden="true">
          <svg width="88" height="64" viewBox="0 0 88 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12h10l6 26h36l6-18H30" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="36" cy="54" r="4" stroke="white" strokeWidth="3"/>
            <circle cx="62" cy="54" r="4" stroke="white" strokeWidth="3"/>
            <path d="M44 6v22m0 0l-8-8m8 8l8-8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Usuario */}
        <label className="sr-only" htmlFor="email">Usuario</label>
        <div className="input-group">
          <span className="input-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14Z" stroke="white" strokeWidth="1.8"/>
            </svg>
          </span>
          <input
            id="email"
            type="email"
            placeholder="USUARIO"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>

        {/* Contraseña */}
        <label className="sr-only" htmlFor="password">Contraseña</label>
        <div className="input-group">
          <span className="input-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 10V8a6 6 0 1 1 12 0v2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <rect x="4" y="10" width="16" height="10" rx="2" stroke="white" strokeWidth="1.8"/>
            </svg>
          </span>
          <input
            id="password"
            type="password"
            placeholder="CONTRASEÑA"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {err && <div className="login-error">{err}</div>}

        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? 'INGRESANDO…' : 'INICIAR SESIÓN'}
        </button>
      </form>
    </div>
  );
}
