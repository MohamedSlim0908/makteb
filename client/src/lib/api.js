import axios from 'axios';

// In production set VITE_API_URL (e.g. https://api.yoursite.com/api). In dev we use Vite proxy so '/api' is enough.
const apiBase = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Extract a user-friendly error message from an Axios error (or generic error).
 * The server returns { error: "message" } so we try that first.
 */
export function getErrorMessage(err, fallback = 'Something went wrong') {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.response?.data?.message) return err.response.data.message;
  if (typeof err?.message === 'string' && !err.message.startsWith('Request failed')) return err.message;
  return fallback;
}

// Paths that should never trigger a token-refresh redirect
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password'];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const reqPath = original?.url || '';

    // Skip refresh logic for auth endpoints to avoid redirect loops
    const isAuthRoute = AUTH_PATHS.some((p) => reqPath.includes(p));

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        await axios.post(`${apiBase}/auth/refresh`, {}, { withCredentials: true });
        return api(original);
      } catch {
        // Clear stale token so the app state resets
        localStorage.removeItem('accessToken');
        // Only redirect if not already on login
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
