import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCreatePost(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/posts', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
  });
}
