import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCommunity(slug) {
  return useQuery({
    queryKey: ['community', slug],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${slug}`);
      return data.community;
    },
    enabled: !!slug,
  });
}
