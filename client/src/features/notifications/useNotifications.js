import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useNotifications({ page = 1, limit = 20 } = {}) {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const { data } = await api.get(`/notifications?page=${page}&limit=${limit}`);
      return data;
    },
  });
}
