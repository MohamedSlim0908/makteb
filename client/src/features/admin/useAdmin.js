import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data;
    },
  });
}

export function useAdminUsers({ page = 1, search = '' } = {}) {
  return useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/users?${params}`);
      return data;
    },
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => api.put(`/admin/users/${userId}/ban`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useAdminPosts({ page = 1, search = '' } = {}) {
  return useQuery({
    queryKey: ['admin-posts', page, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/posts?${params}`);
      return data;
    },
  });
}

export function useAdminDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => api.delete(`/admin/posts/${postId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-posts'] });
    },
  });
}

export function useAdminCommunities({ page = 1, search = '' } = {}) {
  return useQuery({
    queryKey: ['admin-communities', page, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/communities?${params}`);
      return data;
    },
  });
}

export function useAdminCourses({ page = 1, search = '' } = {}) {
  return useQuery({
    queryKey: ['admin-courses', page, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/courses?${params}`);
      return data;
    },
  });
}

export function useToggleCoursePublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId) => api.put(`/admin/courses/${courseId}/toggle-publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });
}

export function useAdminEvents({ page = 1 } = {}) {
  return useQuery({
    queryKey: ['admin-events', page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      const { data } = await api.get(`/admin/events?${params}`);
      return data;
    },
  });
}

export function useAdminDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId) => api.delete(`/admin/events/${eventId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] });
    },
  });
}
