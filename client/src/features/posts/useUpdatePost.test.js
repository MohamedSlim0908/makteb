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
import { useUpdatePost } from './useUpdatePost';

let qc;
function createWrapper() {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useUpdatePost', () => {
  it('calls PUT /posts/:id with payload', async () => {
    const payload = { postId: 'p1', title: 'Updated', content: 'New content', category: 'GENERAL' };
    api.put.mockResolvedValue({ data: { post: { id: 'p1', ...payload } } });

    const { result } = renderHook(() => useUpdatePost('c1'), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.put).toHaveBeenCalledWith('/posts/p1', {
      title: 'Updated',
      content: 'New content',
      category: 'GENERAL',
    });
  });

  it('invalidates community-posts queries on success', async () => {
    api.put.mockResolvedValue({ data: { post: { id: 'p1' } } });
    const wrapper = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useUpdatePost('c1'), { wrapper });

    await act(async () => {
      result.current.mutate({ postId: 'p1', title: 'Test', content: 'Content' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['community-posts', 'c1'] });
  });
});
