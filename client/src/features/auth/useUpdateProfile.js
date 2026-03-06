import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export function useUpdateProfile() {
  const { fetchUser } = useAuth();

  return useMutation({
    mutationFn: (body) => api.put('/auth/me', body),
    onSuccess: async () => {
      await fetchUser();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to update profile'));
    },
  });
}
