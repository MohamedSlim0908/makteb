import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function usePosts(communityId, { category = 'ALL', pageSize = 10, enabled = true } = {}) {
  return useInfiniteQuery({
    queryKey: ['community-posts', communityId, category],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.set('page', String(pageParam));
      params.set('limit', String(pageSize));
      if (category !== 'ALL') params.set('category', category);
      const { data } = await api.get(`/posts/community/${communityId}?${params}`);
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + (p.posts?.length || 0), 0);
      return loaded < (lastPage.total || 0) ? allPages.length + 1 : undefined;
    },
    enabled: !!communityId && enabled,
  });
}
