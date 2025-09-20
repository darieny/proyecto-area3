import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Cargando…</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
