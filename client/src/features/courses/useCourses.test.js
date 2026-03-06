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
import { useCourses } from './useCourses';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCourses', () => {
  it('fetches GET /courses/community/:id and returns courses array', async () => {
    const courses = [{ id: 'co1', title: 'Course 1' }];
    api.get.mockResolvedValue({ data: { courses } });

    const { result } = renderHook(() => useCourses('c1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/courses/community/c1');
    expect(result.current.data).toEqual(courses);
  });

  it('does not fetch when communityId is falsy', () => {
    renderHook(() => useCourses(null), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('does not fetch when enabled is false', () => {
    renderHook(() => useCourses('c1', { enabled: false }), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
