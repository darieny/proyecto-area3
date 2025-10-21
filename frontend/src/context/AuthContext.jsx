// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthToken } from '../services/http.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const TOKEN_KEY = 'auth_token';

// Helper para normalizar el rol (elimina tildes y pasa a minúsculas)
const normalizeRole = (rol) =>
  String(rol || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase(); // "Técnico" → "tecnico"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Al montar: si hay token guardado, validar con /auth/me ---
  useEffect(() => {
    (async () => {
      try {
        const saved = localStorage.getItem(TOKEN_KEY);
        if (saved) {
          setAuthToken(saved);
          const { data } = await api.get('/auth/me');
          const rol = normalizeRole(data.user?.rol);
          setUser({ ...data.user, rol });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('AuthContext: error al validar token', err);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- LOGIN ---
  async function login(correo, password) {
    const { data } = await api.post('/auth/login', { correo, password });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setAuthToken(data.token);
    }
    const rol = normalizeRole(data.user?.rol);
    const u = { ...data.user, rol }; 
    setUser(u);
    return u;
  }

  // --- LOGOUT ---
  async function logout() {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      setUser(null);
      // Redirige directo al login y evita regresar con “atrás”
      window.location.replace('/login');
    }
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}



