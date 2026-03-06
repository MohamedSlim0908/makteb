import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useDeletePost(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => api.delete(`/posts/${postId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
  });
}
