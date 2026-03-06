import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('../lib/socket', () => ({
  connectSocket: vi.fn(),
  getSocket: vi.fn(() => mockSocket),
  disconnectSocket: vi.fn(),
}));

import { connectSocket, getSocket } from '../lib/socket';
import { useCommunitySocket } from './useCommunitySocket';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  getSocket.mockReturnValue(mockSocket);
});

describe('useCommunitySocket', () => {
  it('calls connectSocket and emits join:community on mount', () => {
    renderHook(() => useCommunitySocket('c1'), { wrapper: createWrapper() });

    expect(connectSocket).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('join:community', 'c1');
  });

  it('registers event listeners for post:created, post:deleted, comment:created, points:awarded', () => {
    renderHook(() => useCommunitySocket('c1'), { wrapper: createWrapper() });

    const events = mockSocket.on.mock.calls.map((c) => c[0]);
    expect(events).toContain('post:created');
    expect(events).toContain('post:deleted');
    expect(events).toContain('comment:created');
    expect(events).toContain('points:awarded');
  });

  it('cleans up listeners and emits leave:community on unmount', () => {
    const { unmount } = renderHook(() => useCommunitySocket('c1'), { wrapper: createWrapper() });

    unmount();

    const offEvents = mockSocket.off.mock.calls.map((c) => c[0]);
    expect(offEvents).toContain('post:created');
    expect(offEvents).toContain('post:deleted');
    expect(offEvents).toContain('comment:created');
    expect(offEvents).toContain('points:awarded');
    expect(mockSocket.emit).toHaveBeenCalledWith('leave:community', 'c1');
  });

  it('does nothing when communityId is null', () => {
    renderHook(() => useCommunitySocket(null), { wrapper: createWrapper() });

    expect(connectSocket).not.toHaveBeenCalled();
    expect(mockSocket.emit).not.toHaveBeenCalled();
    expect(mockSocket.on).not.toHaveBeenCalled();
  });
});
