import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dash">
      <div className="dash-card">
        <h1>¡Bienvenido{user?.nombre_completo ? `, ${user.nombre_completo}` : ''}! 🎉</h1>
        <p>Rol: <strong>{user?.rol || '—'}</strong></p>
      </div>
    </div>
  );
}
