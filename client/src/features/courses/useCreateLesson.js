import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useCreateLesson(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, title, content, videoUrl }) =>
      api.post('/lessons', { moduleId, title, content, videoUrl }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-courses', communityId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to create lesson'));
    },
  });
}
