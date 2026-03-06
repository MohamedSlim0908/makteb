import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useLeaveCommunity(communityId, slug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/communities/${communityId}/leave`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['membership', communityId] });
      qc.invalidateQueries({ queryKey: ['community', slug] });
    },
  });
}
