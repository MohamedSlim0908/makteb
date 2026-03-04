import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout } = useAuthStore();

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  useEffect(() => {
    const stored = localStorage.getItem('accessToken');
    if (stored) {
      setAccessToken(stored);
      void fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser, setLoading]);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    setAccessToken(data.accessToken);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data.user;
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout network failures and clear local auth state anyway.
    }
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    logout();
  }

  return { user, isLoading, login, register, logout: handleLogout, fetchUser };
}
