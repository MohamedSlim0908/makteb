import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useToggleLike(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => api.post(`/posts/${postId}/like`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
  });
}
