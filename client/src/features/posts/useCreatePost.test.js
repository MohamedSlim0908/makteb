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
import { useCreatePost } from './useCreatePost';

let qc;
function createWrapper() {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCreatePost', () => {
  it('calls POST /posts with payload', async () => {
    const payload = { title: 'New Post', content: 'Content', communityId: 'c1' };
    api.post.mockResolvedValue({ data: { post: { id: 'p1', ...payload } } });

    const { result } = renderHook(() => useCreatePost('c1'), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/posts', payload);
  });

  it('invalidates community-posts queries on success', async () => {
    api.post.mockResolvedValue({ data: { post: { id: 'p1' } } });
    const wrapper = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCreatePost('c1'), { wrapper });

    await act(async () => {
      result.current.mutate({ title: 'Test' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['community-posts', 'c1'] });
  });
});
