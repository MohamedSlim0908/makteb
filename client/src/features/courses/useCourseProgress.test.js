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

// Mock axios.isAxiosError
vi.mock('axios', () => ({
  default: {
    isAxiosError: (err) => err?.isAxiosError === true,
  },
  isAxiosError: (err) => err?.isAxiosError === true,
}));

import { api } from '../../lib/api';
import { useCourseProgress } from './useCourseProgress';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCourseProgress', () => {
  it('fetches GET /courses/:id/progress and returns enrollment', async () => {
    const enrollment = { courseId: 'co1', progress: 50 };
    api.get.mockResolvedValue({ data: { enrollment } });

    const { result } = renderHook(() => useCourseProgress('co1', 'u1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/courses/co1/progress');
    expect(result.current.data).toEqual(enrollment);
  });

  it('returns null on 404 error', async () => {
    const error = { isAxiosError: true, response: { status: 404 } };
    api.get.mockRejectedValue(error);

    const { result } = renderHook(() => useCourseProgress('co1', 'u1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('returns null on 401 error', async () => {
    const error = { isAxiosError: true, response: { status: 401 } };
    api.get.mockRejectedValue(error);

    const { result } = renderHook(() => useCourseProgress('co1', 'u1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('does not fetch when courseId is falsy', () => {
    renderHook(() => useCourseProgress(null, 'u1'), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('does not fetch when userId is falsy', () => {
    renderHook(() => useCourseProgress('co1', null), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
