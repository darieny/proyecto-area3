import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Cargando…</div>;
  if (!user)    return <Navigate to="/login" replace />;

  // Acepta string o array de roles; compara en minúsculas
  const allow = Array.isArray(role) ? role.map(r => String(r).toLowerCase()) : [String(role).toLowerCase()];
  const userRole = String(user.rol || user.role || '').toLowerCase();

  return allow.includes(userRole) ? children : <Navigate to="/" replace />;
}
