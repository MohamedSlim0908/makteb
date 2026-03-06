import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useMembership(communityId, userId) {
  return useQuery({
    queryKey: ['membership', communityId, userId],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/membership`);
      return data;
    },
    enabled: !!communityId && !!userId,
    retry: false,
  });
}
