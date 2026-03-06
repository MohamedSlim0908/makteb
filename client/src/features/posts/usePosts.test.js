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
import { usePosts } from './usePosts';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('usePosts', () => {
  it('fetches GET /posts/community/:id with page and limit params', async () => {
    const mockData = { posts: [{ id: 'p1', title: 'Post 1' }], total: 1 };
    api.get.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => usePosts('c1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining('/posts/community/c1')
    );
    // Verify page=1 and limit=10 default params
    const calledUrl = api.get.mock.calls[0][0];
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('limit=10');
  });

  it('supports category filter', async () => {
    api.get.mockResolvedValue({ data: { posts: [], total: 0 } });

    const { result } = renderHook(() => usePosts('c1', { category: 'DISCUSSION' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = api.get.mock.calls[0][0];
    expect(calledUrl).toContain('category=DISCUSSION');
  });

  it('does not include category param when set to ALL', async () => {
    api.get.mockResolvedValue({ data: { posts: [], total: 0 } });

    const { result } = renderHook(() => usePosts('c1', { category: 'ALL' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = api.get.mock.calls[0][0];
    expect(calledUrl).not.toContain('category=');
  });

  it('does not fetch when communityId is falsy', () => {
    renderHook(() => usePosts(null), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('does not fetch when enabled is false', () => {
    renderHook(() => usePosts('c1', { enabled: false }), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
