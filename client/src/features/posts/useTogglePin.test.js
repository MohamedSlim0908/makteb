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
import { useTogglePin } from './useTogglePin';

let qc;
function createWrapper() {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useTogglePin', () => {
  it('calls PUT /posts/:id/pin', async () => {
    api.put.mockResolvedValue({ data: { post: { id: 'p1', pinned: true } } });

    const { result } = renderHook(() => useTogglePin('c1'), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('p1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.put).toHaveBeenCalledWith('/posts/p1/pin');
  });

  it('invalidates community-posts queries on success', async () => {
    api.put.mockResolvedValue({ data: { post: { id: 'p1', pinned: true } } });
    const wrapper = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useTogglePin('c1'), { wrapper });

    await act(async () => {
      result.current.mutate('p1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['community-posts', 'c1'] });
  });
});
