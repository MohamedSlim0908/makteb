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
import { useCompleteLesson } from './useCompleteLesson';

let qc;
function createWrapper() {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCompleteLesson', () => {
  it('calls POST /lessons/:id/complete', async () => {
    api.post.mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useCompleteLesson('co1'), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('lesson1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/lessons/lesson1/complete');
  });

  it('invalidates course-progress queries on success', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    const wrapper = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCompleteLesson('co1'), { wrapper });

    await act(async () => {
      result.current.mutate('lesson1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['course-progress', 'co1'] });
  });
});
