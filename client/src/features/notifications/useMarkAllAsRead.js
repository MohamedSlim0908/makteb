import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      await qc.cancelQueries({ queryKey: ['notifications-unread-count'] });

      const previousNotifications = qc.getQueriesData({ queryKey: ['notifications'] });
      const previousCount = qc.getQueryData(['notifications-unread-count']);

      qc.setQueriesData({ queryKey: ['notifications'] }, (old) => {
        if (!old?.notifications) return old;
        return {
          ...old,
          notifications: old.notifications.map((n) => ({ ...n, read: true })),
        };
      });

      qc.setQueryData(['notifications-unread-count'], 0);

      return { previousNotifications, previousCount };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        for (const [key, data] of context.previousNotifications) {
          qc.setQueryData(key, data);
        }
      }
      if (context?.previousCount !== undefined) {
        qc.setQueryData(['notifications-unread-count'], context.previousCount);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}
