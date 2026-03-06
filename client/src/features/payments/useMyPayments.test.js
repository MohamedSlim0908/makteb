import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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

import { api } from '../../lib/api';
import { useMyPayments } from './useMyPayments';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useMyPayments', () => {
  it('fetches GET /payments/my and returns the payments array', async () => {
    const payments = [
      { id: 'p1', amount: 50, status: 'COMPLETED' },
      { id: 'p2', amount: 30, status: 'PENDING' },
    ];
    api.get.mockResolvedValue({ data: { payments } });

    const { result } = renderHook(() => useMyPayments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/payments/my');
    expect(result.current.data).toEqual(payments);
  });

  it('sets error state when the API call fails', async () => {
    api.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMyPayments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
