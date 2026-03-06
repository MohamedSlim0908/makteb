import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useEarnings(communityId) {
  return useQuery({
    queryKey: ['earnings', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/payments/earnings/${communityId}`);
      return data;
    },
    enabled: !!communityId,
  });
}
