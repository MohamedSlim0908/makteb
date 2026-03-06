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
import { useCourse } from './useCourse';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCourse', () => {
  it('fetches GET /courses/:id and returns unwrapped course', async () => {
    const course = { id: 'co1', title: 'React 101' };
    api.get.mockResolvedValue({ data: { course } });

    const { result } = renderHook(() => useCourse('co1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/courses/co1');
    expect(result.current.data).toEqual(course);
  });

  it('does not fetch when courseId is falsy', () => {
    renderHook(() => useCourse(null), { wrapper: createWrapper() });
    expect(api.get).not.toHaveBeenCalled();
  });
});
