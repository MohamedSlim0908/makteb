import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useSearch(query) {
  const trimmed = query?.trim() || '';

  const communities = useQuery({
    queryKey: ['search-communities', trimmed],
    queryFn: async () => {
      const params = new URLSearchParams({ search: trimmed, limit: '10' });
      const { data } = await api.get(`/communities?${params}`);
      return data.communities ?? [];
    },
    enabled: trimmed.length >= 2,
  });

  const courses = useQuery({
    queryKey: ['search-courses', trimmed],
    queryFn: async () => {
      const params = new URLSearchParams({ search: trimmed, limit: '10' });
      const { data } = await api.get(`/courses?${params}`);
      return data.courses ?? [];
    },
    enabled: trimmed.length >= 2,
  });

  return {
    communities: communities.data ?? [],
    courses: courses.data ?? [],
    isLoading: communities.isLoading || courses.isLoading,
    hasQuery: trimmed.length >= 2,
  };
}
