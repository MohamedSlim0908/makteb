import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useCreatePost(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/posts', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to create post'));
    },
  });
}
