import axios from 'axios';

// In production set VITE_API_URL (e.g. https://api.yoursite.com/api). In dev we use Vite proxy so '/api' is enough.
const apiBase = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await axios.post(`${apiBase}/auth/refresh`, {}, { withCredentials: true });
        return api(original);
      } catch {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
