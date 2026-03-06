import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useUpcomingEvent(communityId) {
  return useQuery({
    queryKey: ['upcoming-event', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/events/community/${communityId}/upcoming`);
      return data.event;
    },
    enabled: !!communityId,
  });
}
