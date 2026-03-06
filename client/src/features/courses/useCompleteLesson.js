import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCompleteLesson(courseId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId) => api.post(`/lessons/${lessonId}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-progress', courseId] });
    },
  });
}
