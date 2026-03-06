import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useCreateEvent(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/events', { ...body, communityId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-events', communityId] });
      qc.invalidateQueries({ queryKey: ['upcoming-event', communityId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to create event'));
    },
  });
}
