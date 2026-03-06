import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useEnrolledCourses(userId) {
  return useQuery({
    queryKey: ['enrolled-courses', userId],
    queryFn: async () => {
      const { data } = await api.get('/courses/enrolled/me');
      return data.enrolledCourses;
    },
    enabled: !!userId,
  });
}
