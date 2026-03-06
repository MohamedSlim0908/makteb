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
import { useCreateCourse } from './useCreateCourse';

let qc;
function createWrapper() {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCreateCourse', () => {
  it('calls POST /courses with communityId in body', async () => {
    const body = { title: 'New Course', description: 'A course' };
    api.post.mockResolvedValue({ data: { course: { id: 'co1' } } });

    const { result } = renderHook(() => useCreateCourse('c1'), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(body);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/courses', { ...body, communityId: 'c1' });
  });

  it('invalidates community-courses queries on success', async () => {
    api.post.mockResolvedValue({ data: { course: { id: 'co1' } } });
    const wrapper = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCourse('c1'), { wrapper });

    await act(async () => {
      result.current.mutate({ title: 'Test' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['community-courses', 'c1'] });
  });
});
