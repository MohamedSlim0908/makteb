import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useToggleLike(communityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => api.post(`/posts/${postId}/like`),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ['community-posts', communityId] });
      await qc.cancelQueries({ queryKey: ['post', postId] });

      const previousPosts = qc.getQueriesData({ queryKey: ['community-posts', communityId] });
      const previousPost = qc.getQueryData(['post', postId]);

      // Optimistic update for infinite query (community feed)
      qc.setQueriesData({ queryKey: ['community-posts', communityId] }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: (page.posts || []).map((post) =>
              post.id === postId
                ? {
                    ...post,
                    isLiked: !post.isLiked,
                    likeCount: post.isLiked
                      ? Math.max(0, (post.likeCount || 0) - 1)
                      : (post.likeCount || 0) + 1,
                  }
                : post
            ),
          })),
        };
      });

      // Optimistic update for single post page
      qc.setQueryData(['post', postId], (old) => {
        if (!old) return old;
        const post = old.post || old;
        const updated = {
          ...post,
          isLiked: !post.isLiked,
          likeCount: post.isLiked
            ? Math.max(0, (post.likeCount || 0) - 1)
            : (post.likeCount || 0) + 1,
        };
        return old.post ? { ...old, post: updated } : updated;
      });

      return { previousPosts, previousPost, postId };
    },
    onError: (err, _postId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        for (const [key, data] of context.previousPosts) {
          qc.setQueryData(key, data);
        }
      }
      if (context?.previousPost) {
        qc.setQueryData(['post', context.postId], context.previousPost);
      }
      toast.error(getErrorMessage(err, 'Failed to like post'));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
  });
}
