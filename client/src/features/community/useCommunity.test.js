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
import { useCommunity } from './useCommunity';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCommunity', () => {
  it('fetches GET /communities/:slug and returns unwrapped community', async () => {
    const community = { id: '1', name: 'Test', slug: 'test-community' };
    api.get.mockResolvedValue({ data: { community } });

    const { result } = renderHook(() => useCommunity('test-community'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/communities/test-community');
    expect(result.current.data).toEqual(community);
  });

  it('does not fetch when slug is falsy', () => {
    renderHook(() => useCommunity(null), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('does not fetch when slug is empty string', () => {
    renderHook(() => useCommunity(''), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
