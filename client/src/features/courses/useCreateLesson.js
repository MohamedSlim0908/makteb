import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCreateLesson(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, title, content, videoUrl }) =>
      api.post('/lessons', { moduleId, title, content, videoUrl }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-courses', communityId] });
    },
  });
}
