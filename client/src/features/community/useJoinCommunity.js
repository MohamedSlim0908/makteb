import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useJoinCommunity(communityId, slug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/communities/${communityId}/join`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['membership', communityId] });
      qc.invalidateQueries({ queryKey: ['community', slug] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to join community'));
    },
  });
}
