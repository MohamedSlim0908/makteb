import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

beforeEach(() => {
  useAuthStore.setState({ user: null, isLoading: true });
});

describe('authStore', () => {
  it('has initial state: user null, isLoading true', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it('setUser: sets user and isLoading false', () => {
    const user = { id: 'u1', name: 'Alice' };
    useAuthStore.getState().setUser(user);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.isLoading).toBe(false);
  });

  it('setLoading: sets isLoading', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it('logout: sets user null and isLoading false', () => {
    useAuthStore.getState().setUser({ id: 'u1' });
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });
});
