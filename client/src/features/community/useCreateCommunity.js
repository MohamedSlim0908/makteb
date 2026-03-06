import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCreateCommunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/communities', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities'] });
    },
  });
}
