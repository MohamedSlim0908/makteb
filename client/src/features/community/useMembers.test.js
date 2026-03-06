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
import { useMembers } from './useMembers';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useMembers', () => {
  it('fetches GET /communities/:id/members and returns members array', async () => {
    const members = [{ id: 'u1', name: 'Alice' }, { id: 'u2', name: 'Bob' }];
    api.get.mockResolvedValue({ data: { members } });

    const { result } = renderHook(() => useMembers('c1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/communities/c1/members');
    expect(result.current.data).toEqual(members);
  });

  it('does not fetch when communityId is falsy', () => {
    renderHook(() => useMembers(null), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
