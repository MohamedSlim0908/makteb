import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => { localStorageMock.store[key] = value; }),
  removeItem: vi.fn((key) => { delete localStorageMock.store[key]; }),
  clear: vi.fn(() => { localStorageMock.store = {}; }),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { headers: { common: {} } },
  },
}));

import { api } from '../lib/api';
import { useAuth } from './useAuth';
import { useAuthStore } from '../store/authStore';

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.store = {};
  localStorageMock.getItem.mockImplementation((key) => localStorageMock.store[key] || null);
  // Reset the zustand store
  useAuthStore.setState({ user: null, isLoading: true });
});

describe('useAuth', () => {
  it('login: calls POST /auth/login, stores token, sets user', async () => {
    const mockUser = { id: 'u1', name: 'Alice' };
    api.post.mockResolvedValue({ data: { accessToken: 'tok123', user: mockUser } });

    const { result } = renderHook(() => useAuth());

    let user;
    await act(async () => {
      user = await result.current.login('alice@test.com', 'password');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'alice@test.com', password: 'password' });
    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'tok123');
    expect(user).toEqual(mockUser);
    expect(result.current.user).toEqual(mockUser);
  });

  it('register: calls POST /auth/register, stores token, sets user', async () => {
    const mockUser = { id: 'u2', name: 'Bob' };
    api.post.mockResolvedValue({ data: { accessToken: 'tok456', user: mockUser } });

    const { result } = renderHook(() => useAuth());

    let user;
    await act(async () => {
      user = await result.current.register('Bob', 'bob@test.com', 'password');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/register', { name: 'Bob', email: 'bob@test.com', password: 'password' });
    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'tok456');
    expect(user).toEqual(mockUser);
    expect(result.current.user).toEqual(mockUser);
  });

  it('logout: calls POST /auth/logout, clears token and user', async () => {
    api.post.mockResolvedValue({});
    // Set up initial state as logged in
    localStorageMock.store.accessToken = 'tok123';
    useAuthStore.setState({ user: { id: 'u1' }, isLoading: false });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/logout');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(result.current.user).toBeNull();
  });

  it('fetchUser: calls GET /auth/me, sets user on success', async () => {
    const mockUser = { id: 'u1', name: 'Alice' };
    api.get.mockResolvedValue({ data: { user: mockUser } });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.fetchUser();
    });

    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(result.current.user).toEqual(mockUser);
  });

  it('fetchUser: clears user on failure', async () => {
    api.get.mockRejectedValue(new Error('Unauthorized'));
    useAuthStore.setState({ user: { id: 'u1' }, isLoading: false });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.fetchUser();
    });

    expect(result.current.user).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
  });

  it('auto-fetches user on mount when token exists in localStorage', async () => {
    const mockUser = { id: 'u1', name: 'Alice' };
    api.get.mockResolvedValue({ data: { user: mockUser } });
    localStorageMock.store.accessToken = 'stored-token';

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(result.current.user).toEqual(mockUser);
  });

  it('sets loading to false when no token in localStorage', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.get).not.toHaveBeenCalled();
  });
});
