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
import { usePost } from './usePost';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('usePost', () => {
  it('fetches GET /posts/:id and returns unwrapped post', async () => {
    const post = { id: 'p1', title: 'My Post', content: 'Hello' };
    api.get.mockResolvedValue({ data: { post } });

    const { result } = renderHook(() => usePost('p1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/posts/p1');
    expect(result.current.data).toEqual(post);
  });

  it('does not fetch when postId is falsy', () => {
    renderHook(() => usePost(null), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
