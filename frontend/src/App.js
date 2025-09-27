import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RequireAuth from './router/RequireAuth';
import RequireRole from './modules/auth/RequireRole';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard'; // temporal p/ supervisor y técnico
import DashboardAdmin from './modules/dashboard/pages/DashboardAdmin';

// Redirige a la ruta correcta según el rol
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const rol = String(user.rol || '').toLowerCase();
  if (rol === 'admin')       return <Navigate to="/dashboard" replace />;
  if (rol === 'supervisor')  return <Navigate to="/supervisor" replace />;
  if (rol === 'técnico' || rol === 'tecnico') return <Navigate to="/tecnico" replace />;

  // Rol desconocido → login
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cambiar-password" element={<ChangePassword />} />

          {/* Protegidas (requieren sesión) */}
          <Route element={<RequireAuth />}>
            {/* Home: decide según rol */}
            <Route index element={<RoleRedirect />} />

            {/* Admin */}
            <Route
              path="/dashboard"
              element={
                <RequireRole role="admin">
                  <DashboardAdmin />
                </RequireRole>
              }
            />

            {/* Supervisor (temporal: reutiliza Dashboard) */}
            <Route
              path="/supervisor"
              element={
                <RequireRole role="supervisor">
                  <Dashboard />
                </RequireRole>
              }
            />

            {/* Técnico (temporal: reutiliza Dashboard) */}
            <Route
              path="/tecnico"
              element={
                <RequireRole role="tecnico">
                  <Dashboard />
                </RequireRole>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


