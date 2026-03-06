import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockFetchUser = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ fetchUser: mockFetchUser }),
}));

import { api } from '../../lib/api';
import { useUpdateProfile } from './useUpdateProfile';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useUpdateProfile', () => {
  it('calls PUT /auth/me with body', async () => {
    const body = { name: 'New Name' };
    api.put.mockResolvedValue({ data: { user: { id: 'u1', name: 'New Name' } } });
    mockFetchUser.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(body);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.put).toHaveBeenCalledWith('/auth/me', body);
  });

  it('calls fetchUser on success', async () => {
    api.put.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFetchUser.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ name: 'Test' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetchUser).toHaveBeenCalled();
  });
});
