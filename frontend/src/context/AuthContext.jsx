import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthToken } from '../services/http.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const TOKEN_KEY = 'auth_token';

// helper opcional para normalizar el rol
const normalizeRole = (rol) =>
  String(rol || '')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase(); // "técnico" -> "tecnico"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar: si hay token guardado, úsalo y consulta /auth/me
  useEffect(() => {
    (async () => {
      try {
        const saved = localStorage.getItem(TOKEN_KEY);
        if (saved) {
          setAuthToken(saved);
          const { data } = await api.get('/auth/me');
          const rol = normalizeRole(data.user?.rol);
          setUser(data.user);
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
    setUser(data.user);
    return data.user;
  }

  // --- LOGOUT ---
  async function logout() {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      setUser(null);
      window.location.replace('/login');
    }
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}


