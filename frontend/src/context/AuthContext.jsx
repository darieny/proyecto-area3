import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthToken } from '../services/http.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar: si hay token guardado, úsalo y consulta /auth/me
  useEffect(() => {
    (async () => {
      try {
        const saved = localStorage.getItem(TOKEN_KEY);
        if (saved) setAuthToken(saved);
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(correo, password) {
    const { data } = await api.post('/auth/login', { correo, password });
    // se espera { token, user }
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setAuthToken(data.token);
    }
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

