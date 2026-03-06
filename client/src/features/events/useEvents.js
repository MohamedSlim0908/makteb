import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useEvents(communityId, { month, year } = {}) {
  return useQuery({
    queryKey: ['community-events', communityId, month, year],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (month !== undefined) params.set('month', String(month));
      if (year !== undefined) params.set('year', String(year));
      const { data } = await api.get(`/events/community/${communityId}?${params}`);
      return data.events;
    },
    enabled: !!communityId,
  });
}
