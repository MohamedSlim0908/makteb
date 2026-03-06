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
import { useCommunities } from './useCommunities';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCommunities', () => {
  it('fetches GET /communities with default page=1 and limit=50', async () => {
    const mockData = { communities: [{ id: '1', name: 'Test' }], total: 1 };
    api.get.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useCommunities(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/communities?page=1&limit=50');
    expect(result.current.data).toEqual(mockData);
  });

  it('passes custom page and limit params', async () => {
    api.get.mockResolvedValue({ data: { communities: [], total: 0 } });

    const { result } = renderHook(() => useCommunities({ page: 2, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/communities?page=2&limit=10');
  });

  it('passes search param when provided', async () => {
    api.get.mockResolvedValue({ data: { communities: [], total: 0 } });

    const { result } = renderHook(() => useCommunities({ search: 'react' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/communities?page=1&limit=50&search=react');
  });

  it('passes category param when provided', async () => {
    api.get.mockResolvedValue({ data: { communities: [], total: 0 } });

    const { result } = renderHook(() => useCommunities({ category: 'tech' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/communities?page=1&limit=50&category=tech');
  });

  it('passes both search and category params', async () => {
    api.get.mockResolvedValue({ data: { communities: [], total: 0 } });

    const { result } = renderHook(() => useCommunities({ search: 'coding', category: 'tech' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/communities?page=1&limit=50&search=coding&category=tech');
  });

  it('omits search and category from URL when empty strings', async () => {
    api.get.mockResolvedValue({ data: { communities: [], total: 0 } });

    const { result } = renderHook(() => useCommunities({ search: '', category: '' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/communities?page=1&limit=50');
  });

  it('has 30s staleTime', async () => {
    api.get.mockResolvedValue({ data: { communities: [] } });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }) => createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useCommunities(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Re-render should not trigger another fetch due to staleTime
    const { result: result2 } = renderHook(() => useCommunities(), { wrapper });

    await waitFor(() => expect(result2.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledTimes(1);
  });
});
