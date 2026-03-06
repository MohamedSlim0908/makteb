import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useTogglePin(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => api.put(`/posts/${postId}/pin`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to pin post'));
    },
  });
}
