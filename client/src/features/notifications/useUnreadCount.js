import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count');
      return data.count;
    },
    refetchInterval: 30_000,
  });
}
