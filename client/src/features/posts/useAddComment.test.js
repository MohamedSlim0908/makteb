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
import { useAddComment } from './useAddComment';

let qc;
function createWrapper() {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useAddComment', () => {
  it('calls POST /posts/:id/comments with content and parentId', async () => {
    api.post.mockResolvedValue({ data: { comment: { id: 'cm1' } } });

    const { result } = renderHook(() => useAddComment('p1'), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ content: 'Nice post!', parentId: null });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/posts/p1/comments', {
      content: 'Nice post!',
      parentId: null,
    });
  });

  it('invalidates post query on success', async () => {
    api.post.mockResolvedValue({ data: { comment: { id: 'cm1' } } });
    const wrapper = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useAddComment('p1'), { wrapper });

    await act(async () => {
      result.current.mutate({ content: 'Reply', parentId: 'cm0' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['post', 'p1'] });
  });
});
