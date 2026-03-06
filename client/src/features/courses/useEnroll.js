import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useEnroll(courseId, userId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/courses/${courseId}/enroll`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-progress', courseId, userId] });
    },
  });
}
