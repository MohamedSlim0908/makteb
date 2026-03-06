import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCreateCourse(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/courses', { ...body, communityId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-courses', communityId] });
    },
  });
}
