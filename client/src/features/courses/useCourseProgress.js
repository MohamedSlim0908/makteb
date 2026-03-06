import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '../../lib/api';

export function useCourseProgress(courseId, userId) {
  return useQuery({
    queryKey: ['course-progress', courseId, userId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/courses/${courseId}/progress`);
        return data.enrollment;
      } catch (err) {
        if (axios.isAxiosError(err) && [401, 404].includes(err.response?.status || 0)) return null;
        throw err;
      }
    },
    enabled: !!courseId && !!userId,
    retry: false,
  });
}
