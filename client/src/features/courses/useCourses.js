import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCourses(communityId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['community-courses', communityId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/community/${communityId}`);
      return data.courses;
    },
    enabled: !!communityId && enabled,
  });
}
