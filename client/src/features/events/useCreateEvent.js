import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCreateEvent(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/events', { ...body, communityId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-events', communityId] });
      qc.invalidateQueries({ queryKey: ['upcoming-event', communityId] });
    },
  });
}
