import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useSetAttendance(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }) => api.post(`/events/${eventId}/attend`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-events', communityId] });
    },
  });
}
