// src/modules/auth/RequireRole.jsx
import { useAuth } from '../../context/AuthContext';

export default function RequireRole({ role, children }) {
  const { user } = useAuth();

  if (!user) return <div>Inicia sesión…</div>;
  if (user.rol !== role) return <div>No autorizado</div>;

  return children;
}
