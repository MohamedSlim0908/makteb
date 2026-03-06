import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useEnroll(courseId, userId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/courses/${courseId}/enroll`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-progress', courseId, userId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to enroll'));
    },
  });
}
