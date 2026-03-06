import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useInitiatePayment() {
  return useMutation({
    mutationFn: ({ type, referenceId, amount }) =>
      api.post('/payments/initiate', { type, referenceId, amount }),
  });
}
