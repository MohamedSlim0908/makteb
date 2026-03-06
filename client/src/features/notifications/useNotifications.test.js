import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from '../../lib/api';
import { useNotifications } from './useNotifications';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useNotifications', () => {
  it('fetches notifications with default pagination', async () => {
    const mockData = {
      notifications: [{ id: 'n1', title: 'Test', body: 'Body', read: false }],
      total: 1,
      page: 1,
      totalPages: 1,
    };
    api.get.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/notifications?page=1&limit=20');
    expect(result.current.data.notifications).toHaveLength(1);
  });

  it('passes custom page and limit', async () => {
    api.get.mockResolvedValue({ data: { notifications: [], total: 0, page: 2, totalPages: 0 } });

    const { result } = renderHook(() => useNotifications({ page: 2, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/notifications?page=2&limit=10');
  });
});
