import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useCreateCommunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/communities', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to create community'));
    },
  });
}
