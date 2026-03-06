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
import { useEnrolledCourses } from './useEnrolledCourses';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useEnrolledCourses', () => {
  it('fetches GET /courses/enrolled/me and returns enrolledCourses array', async () => {
    const enrolledCourses = [{ id: 'co1', title: 'Course 1' }];
    api.get.mockResolvedValue({ data: { enrolledCourses } });

    const { result } = renderHook(() => useEnrolledCourses('u1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/courses/enrolled/me');
    expect(result.current.data).toEqual(enrolledCourses);
  });

  it('does not fetch when userId is falsy', () => {
    renderHook(() => useEnrolledCourses(null), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
