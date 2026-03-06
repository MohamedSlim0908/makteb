import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useMembers(communityId) {
  return useQuery({
    queryKey: ['community-members', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/members`);
      return data.members;
    },
    enabled: !!communityId,
  });
}
