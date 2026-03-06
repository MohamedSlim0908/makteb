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
import { useCreateCommunity } from './useCreateCommunity';

let qc;
function createWrapper() {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCreateCommunity', () => {
  it('calls POST /communities with body', async () => {
    const body = { name: 'New Community', description: 'A test community' };
    api.post.mockResolvedValue({ data: { community: { id: 'c1', ...body } } });

    const { result } = renderHook(() => useCreateCommunity(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(body);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/communities', body);
  });

  it('invalidates communities queries on success', async () => {
    api.post.mockResolvedValue({ data: { community: { id: 'c1' } } });
    const wrapper = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCommunity(), { wrapper });

    await act(async () => {
      result.current.mutate({ name: 'Test' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['communities'] });
  });
});
