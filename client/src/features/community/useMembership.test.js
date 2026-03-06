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
import { useMembership } from './useMembership';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useMembership', () => {
  it('fetches GET /communities/:id/membership and returns raw response', async () => {
    const mockData = { membership: { role: 'member', communityId: 'c1' } };
    api.get.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useMembership('c1', 'u1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/communities/c1/membership');
    expect(result.current.data).toEqual(mockData);
  });

  it('does not fetch when communityId is falsy', () => {
    renderHook(() => useMembership(null, 'u1'), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('does not fetch when userId is falsy', () => {
    renderHook(() => useMembership('c1', null), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
