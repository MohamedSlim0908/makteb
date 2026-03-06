import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';

export function useAddComment(postId, currentUser) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, parentId }) =>
      api.post(`/posts/${postId}/comments`, { content, parentId }),
    onMutate: async ({ content, parentId }) => {
      await qc.cancelQueries({ queryKey: ['post', postId] });

      const previousPost = qc.getQueryData(['post', postId]);

      // Only apply optimistic update if we have user data and it's a top-level comment
      if (currentUser && !parentId) {
        qc.setQueryData(['post', postId], (old) => {
          if (!old) return old;
          const post = old.post || old;
          const optimisticComment = {
            id: `temp-${Date.now()}`,
            postId,
            authorId: currentUser.id,
            content,
            parentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
            replies: [],
          };
          const updated = {
            ...post,
            comments: [...(post.comments || []), optimisticComment],
            commentCount: (post.commentCount || 0) + 1,
          };
          return old.post ? { ...old, post: updated } : updated;
        });
      }

      return { previousPost };
    },
    onError: (err, _vars, context) => {
      if (context?.previousPost) {
        qc.setQueryData(['post', postId], context.previousPost);
      }
      toast.error(getErrorMessage(err, 'Failed to add comment'));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}
