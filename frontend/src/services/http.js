import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // manda/recibe cookies httpOnly
});

// Reintenta una vez con /auth/refresh cuando reciba 401
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
