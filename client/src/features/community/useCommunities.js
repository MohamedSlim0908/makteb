import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCommunities({ page = 1, limit = 50, search = '', category = '' } = {}) {
  return useQuery({
    queryKey: ['communities', page, limit, search, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const { data } = await api.get(`/communities?${params}`);
      return data;
    },
    staleTime: 30_000,
  });
}
