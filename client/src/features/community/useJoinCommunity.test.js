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

import { api } from '../../lib/api';
import { useJoinCommunity } from './useJoinCommunity';

let qc;
function createWrapper() {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useJoinCommunity', () => {
  it('calls POST /communities/:id/join', async () => {
    api.post.mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useJoinCommunity('c1', 'my-slug'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/communities/c1/join');
  });

  it('invalidates membership and community queries on success', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    const wrapper = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useJoinCommunity('c1', 'my-slug'), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['membership', 'c1'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['community', 'my-slug'] });
  });
});
