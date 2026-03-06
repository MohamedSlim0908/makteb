import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId) => api.post(`/payments/verify/${paymentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['membership'] });
      qc.invalidateQueries({ queryKey: ['course-progress'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Payment verification failed'));
    },
  });
}
