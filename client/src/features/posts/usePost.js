import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function usePost(postId) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${postId}`);
      return data.post;
    },
    enabled: !!postId,
  });
}
