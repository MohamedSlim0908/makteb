import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useCreateModule(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, title }) => api.post(`/courses/${courseId}/modules`, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-courses', communityId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to create module'));
    },
  });
}
