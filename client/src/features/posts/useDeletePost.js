import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useDeletePost(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => api.delete(`/posts/${postId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to delete post'));
    },
  });
}
