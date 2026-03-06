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
import { useVerifyPayment } from './useVerifyPayment';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useVerifyPayment', () => {
  it('calls POST /payments/verify/:paymentId and returns result', async () => {
    const response = { data: { status: 'COMPLETED', payment: { id: 'p1' } } };
    api.post.mockResolvedValue(response);

    const { result } = renderHook(() => useVerifyPayment(), { wrapper: createWrapper() });

    result.current.mutate('p1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/payments/verify/p1');
    expect(result.current.data).toEqual(response);
  });

  it('invalidates membership and course-progress queries on success', async () => {
    api.post.mockResolvedValue({ data: { status: 'COMPLETED' } });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }) => createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useVerifyPayment(), { wrapper });

    result.current.mutate('p2');

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ['membership'] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ['course-progress'] });
    });
  });

  it('sets error state when the API call fails', async () => {
    api.post.mockRejectedValue(new Error('Verification failed'));

    const { result } = renderHook(() => useVerifyPayment(), { wrapper: createWrapper() });

    result.current.mutate('bad-id');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
