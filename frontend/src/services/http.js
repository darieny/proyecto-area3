import axios from 'axios';

const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true, // no estorba si también usas Authorization
});

// ===== Manejo de token en header Authorization =====
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// ===== (opcional) refresco por cookie si tu backend lo soporta =====
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config || {};
    const status = error.response?.status;
    const isRefresh = (config.url || '').endsWith('/auth/refresh');

    if (status === 401 && !config._retry && !isRefresh) {
      config._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(config);
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);

