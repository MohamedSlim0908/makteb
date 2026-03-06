import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId) => api.post(`/payments/verify/${paymentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['membership'] });
      qc.invalidateQueries({ queryKey: ['course-progress'] });
    },
  });
}
