import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useLeaveCommunity(communityId, slug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/communities/${communityId}/leave`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['membership', communityId] });
      qc.invalidateQueries({ queryKey: ['community', slug] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to leave community'));
    },
  });
}
