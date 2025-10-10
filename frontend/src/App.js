// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RequireAuth from './router/RequireAuth';
import RequireRole from './router/RequireRole';
import Clientes from './modules/clientes/pages/Clientes';
import ClienteDetail from './modules/clientes/pages/ClientesDetail';
import VisitasPage from './modules/visitas/pages/VisitasPage';

// Páginas base
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';

// Dashboard Admin
import DashboardAdmin from './modules/dashboard/pages/DashboardAdmin';

// Redirección automática según rol
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const rol = String(user.rol || '').toLowerCase();
  if (rol === 'admin') return <Navigate to="/dashboard" replace />;
  if (rol === 'supervisor') return <Navigate to="/supervisor" replace />;
  if (rol === 'técnico' || rol === 'tecnico') return <Navigate to="/tecnico" replace />;

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cambiar-password" element={<ChangePassword />} />

          {/* protegidas */}
          <Route element={<RequireAuth />}>
            {/* / -> redirige por rol */}
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
            <Route
              path="/clientes"
              element={
                <RequireRole role="admin">
                  <Clientes />
                </RequireRole>
              }
            />
            <Route
              path="/clientes/:id"
              element={
                <RequireRole role="admin">
                  <ClienteDetail />
                </RequireRole>
              }
            />
            <Route path="/visitas" 
            element={
              <RequireRole role="admin">
                <VisitasPage />
              </RequireRole>
            } 
            />

            {/* placeholders para luego */}
            {/* <Route path="/supervisor" element={<RequireRole role="supervisor"><SupervisorHome/></RequireRole>} /> */}
            {/* <Route path="/tecnico"    element={<RequireRole role="tecnico"><TecnicoHome/></RequireRole>} /> */}
          </Route>

          {/* fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


