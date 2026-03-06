import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useAddComment(postId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, parentId }) =>
      api.post(`/posts/${postId}/comments`, { content, parentId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}
