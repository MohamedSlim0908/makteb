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
import { useInitiatePayment } from './useInitiatePayment';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useInitiatePayment', () => {
  it('calls POST /payments/initiate with type, referenceId, and amount', async () => {
    const response = { data: { paymentUrl: 'https://flouci.com/pay', paymentId: 'p1' } };
    api.post.mockResolvedValue(response);

    const { result } = renderHook(() => useInitiatePayment(), { wrapper: createWrapper() });

    result.current.mutate({ type: 'COURSE', referenceId: 'c1', amount: 50 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/payments/initiate', {
      type: 'COURSE',
      referenceId: 'c1',
      amount: 50,
    });
    expect(result.current.data).toEqual(response);
  });

  it('sets error state when the API call fails', async () => {
    api.post.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useInitiatePayment(), { wrapper: createWrapper() });

    result.current.mutate({ type: 'COMMUNITY', referenceId: 'x1', amount: 20 });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
