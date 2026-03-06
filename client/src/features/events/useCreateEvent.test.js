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
import { useCreateEvent } from './useCreateEvent';

let qc;
function createWrapper() {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCreateEvent', () => {
  it('calls POST /events with communityId merged into body', async () => {
    const eventPayload = { title: 'LIVE Q&A', startAt: '2026-03-15T17:00:00Z' };
    api.post.mockResolvedValue({ data: { event: { id: 'evt-1', ...eventPayload } } });

    const { result } = renderHook(() => useCreateEvent('com-1'), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(eventPayload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/events', { ...eventPayload, communityId: 'com-1' });
  });

  it('invalidates community-events and upcoming-event queries on success', async () => {
    api.post.mockResolvedValue({ data: { event: { id: 'evt-1' } } });
    const wrapper = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCreateEvent('com-1'), { wrapper });

    await act(async () => {
      result.current.mutate({ title: 'Test', startAt: '2026-03-15T17:00:00Z' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['community-events', 'com-1'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['upcoming-event', 'com-1'] });
  });

  it('sets isError on failure', async () => {
    api.post.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCreateEvent('com-1'), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ title: 'Fail', startAt: '2026-03-15T17:00:00Z' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
