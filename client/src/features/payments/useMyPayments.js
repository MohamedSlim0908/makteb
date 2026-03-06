import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useMyPayments() {
  return useQuery({
    queryKey: ['my-payments'],
    queryFn: async () => {
      const { data } = await api.get('/payments/my');
      return data.payments;
    },
  });
}
