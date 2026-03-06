import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCreateModule(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, title }) => api.post(`/courses/${courseId}/modules`, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-courses', communityId] });
    },
  });
}
