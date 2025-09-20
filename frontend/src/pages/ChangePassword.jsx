import { useState } from 'react';
import { api } from '../services/http';
import './auth.css';

export default function ChangePassword() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [msg, setMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    if (a !== b) return setMsg('Las contraseñas no coinciden');
    try {
      await api.post('/users/change-password', { newPassword: a }); // cuando lo implementes en backend
      setMsg('Contraseña actualizada. Vuelve a iniciar sesión.');
    } catch {
      setMsg('Error al actualizar contraseña');
    }
  }

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Cambiar contraseña</h1>
        <label>Nueva contraseña</label>
        <input type="password" value={a} onChange={(e) => setA(e.target.value)} required />
        <label>Repetir contraseña</label>
        <input type="password" value={b} onChange={(e) => setB(e.target.value)} required />
        {msg && <div className="info">{msg}</div>}
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
}
