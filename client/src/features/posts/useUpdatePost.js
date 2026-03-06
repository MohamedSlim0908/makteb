import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useUpdatePost(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, title, content, category }) =>
      api.put(`/posts/${postId}`, { title, content, category }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to update post'));
    },
  });
}
