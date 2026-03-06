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
import { useEvents } from './useEvents';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

const EVENTS = [
  { id: 'evt-1', title: 'LIVE Q&A', startAt: '2026-03-15T17:00:00Z' },
  { id: 'evt-2', title: 'Feedback', startAt: '2026-03-20T16:00:00Z' },
];

describe('useEvents', () => {
  it('fetches events for a community with month/year params', async () => {
    api.get.mockResolvedValue({ data: { events: EVENTS } });

    const { result } = renderHook(() => useEvents('com-1', { month: 2, year: 2026 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].title).toBe('LIVE Q&A');
    expect(api.get).toHaveBeenCalledWith('/events/community/com-1?month=2&year=2026');
  });

  it('does not fetch when communityId is falsy', () => {
    api.get.mockResolvedValue({ data: { events: [] } });

    const { result } = renderHook(() => useEvents(null, { month: 0, year: 2026 }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('returns empty array when API returns no events', async () => {
    api.get.mockResolvedValue({ data: { events: [] } });

    const { result } = renderHook(() => useEvents('com-1', { month: 5, year: 2026 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
