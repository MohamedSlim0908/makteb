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
import { useCreateModule } from './useCreateModule';

let qc;
function createWrapper() {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCreateModule', () => {
  it('calls POST /courses/:courseId/modules with { title }', async () => {
    api.post.mockResolvedValue({ data: { module: { id: 'm1' } } });

    const { result } = renderHook(() => useCreateModule('c1'), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ courseId: 'co1', title: 'Module 1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/courses/co1/modules', { title: 'Module 1' });
  });

  it('invalidates community-courses queries on success', async () => {
    api.post.mockResolvedValue({ data: { module: { id: 'm1' } } });
    const wrapper = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCreateModule('c1'), { wrapper });

    await act(async () => {
      result.current.mutate({ courseId: 'co1', title: 'Module 1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['community-courses', 'c1'] });
  });
});
