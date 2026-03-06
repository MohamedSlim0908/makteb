import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useInitiatePayment() {
  return useMutation({
    mutationFn: ({ type, referenceId, amount }) =>
      api.post('/payments/initiate', { type, referenceId, amount }),
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to initiate payment'));
    },
  });
}
