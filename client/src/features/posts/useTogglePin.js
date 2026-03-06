import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useTogglePin(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => api.put(`/posts/${postId}/pin`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
  });
}
