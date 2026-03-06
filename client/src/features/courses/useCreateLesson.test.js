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
import { useCreateLesson } from './useCreateLesson';

let qc;
function createWrapper() {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }) => createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useCreateLesson', () => {
  it('calls POST /lessons with { moduleId, title, content, videoUrl }', async () => {
    api.post.mockResolvedValue({ data: { lesson: { id: 'l1' } } });

    const payload = { moduleId: 'm1', title: 'Lesson 1', content: 'Some content', videoUrl: 'https://vid.io/1' };
    const { result } = renderHook(() => useCreateLesson('c1'), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/lessons', payload);
  });

  it('invalidates community-courses queries on success', async () => {
    api.post.mockResolvedValue({ data: { lesson: { id: 'l1' } } });
    const wrapper = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCreateLesson('c1'), { wrapper });

    await act(async () => {
      result.current.mutate({ moduleId: 'm1', title: 'L1', content: '', videoUrl: '' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['community-courses', 'c1'] });
  });
});
