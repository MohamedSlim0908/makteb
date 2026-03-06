import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useLeaderboard(communityId) {
  return useQuery({
    queryKey: ['community-leaderboard', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/gamification/leaderboard/${communityId}`);
      return data.leaderboard;
    },
    enabled: !!communityId,
  });
}
