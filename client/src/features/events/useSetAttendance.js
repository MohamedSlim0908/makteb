import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useSetAttendance(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }) => api.post(`/events/${eventId}/attend`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-events', communityId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to update attendance'));
    },
  });
}
