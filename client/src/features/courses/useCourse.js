import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCourse(courseId) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}`);
      return data.course;
    },
    enabled: !!courseId,
  });
}
