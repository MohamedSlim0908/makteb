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
import { useLeaderboard } from './useLeaderboard';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useLeaderboard', () => {
  it('fetches GET /gamification/leaderboard/:communityId and returns leaderboard array', async () => {
    const leaderboard = [{ userId: 'u1', points: 100 }, { userId: 'u2', points: 80 }];
    api.get.mockResolvedValue({ data: { leaderboard } });

    const { result } = renderHook(() => useLeaderboard('c1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/gamification/leaderboard/c1');
    expect(result.current.data).toEqual(leaderboard);
  });

  it('does not fetch when communityId is falsy', () => {
    renderHook(() => useLeaderboard(null), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
