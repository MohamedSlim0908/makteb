import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export function useUpdateProfile() {
  const { fetchUser } = useAuth();

  return useMutation({
    mutationFn: (body) => api.put('/auth/me', body),
    onSuccess: async () => {
      await fetchUser();
    },
  });
}
