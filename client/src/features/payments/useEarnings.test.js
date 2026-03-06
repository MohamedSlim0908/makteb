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
import { useEarnings } from './useEarnings';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useEarnings', () => {
  it('fetches GET /payments/earnings/:communityId and returns earnings data', async () => {
    const earningsData = { total: 500, monthly: 100 };
    api.get.mockResolvedValue({ data: earningsData });

    const { result } = renderHook(() => useEarnings('c1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/payments/earnings/c1');
    expect(result.current.data).toEqual(earningsData);
  });

  it('does not fetch when communityId is falsy', () => {
    renderHook(() => useEarnings(null), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
