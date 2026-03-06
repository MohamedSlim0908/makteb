import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useCompleteLesson(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId) => api.post(`/lessons/${lessonId}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-progress', courseId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to complete lesson'));
    },
  });
}
