import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useCreateCourse(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/courses', { ...body, communityId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-courses', communityId] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to create course'));
    },
  });
}
