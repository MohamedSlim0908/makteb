import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Pin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { PageSpinner } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { usePost } from '../features/posts/usePost';
import { useAddComment } from '../features/posts/useAddComment';
import { useUpdatePost } from '../features/posts/useUpdatePost';
import { useDeletePost } from '../features/posts/useDeletePost';
import { useTogglePin } from '../features/posts/useTogglePin';
import { useMembership } from '../features/community/useMembership';
import { PostActionMenu } from '../components/course-community/PostActionMenu';
import { EditPostModal } from '../components/course-community/EditPostModal';
import { DeleteConfirmModal } from '../components/course-community/DeleteConfirmModal';
import { RichContent } from '../components/ui/RichContent';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const MODERATOR_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

export function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingPost, setEditingPost] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = usePost(id);

  const communityId = post?.communityId;
  const { data: membership } = useMembership(communityId, user?.id);
  const memberRole = membership?.membership?.role;
  const isAuthor = user && (post?.authorId === user.id || post?.author?.id === user.id);
  const isModerator = MODERATOR_ROLES.includes(memberRole);

  const updatePostMutation = useUpdatePost(communityId);
  const deletePostMutation = useDeletePost(communityId);
  const togglePinMutation = useTogglePin(communityId);

  const toggleLikeMutation = useMutation({
    mutationFn: () => api.post(`/posts/${id}/like`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', id] });
      const previousPost = queryClient.getQueryData(['post', id]);
      queryClient.setQueryData(['post', id], (old) => {
        if (!old) return old;
        const p = old.post || old;
        const updated = {
          ...p,
          isLiked: !p.isLiked,
          likeCount: p.isLiked ? Math.max(0, (p.likeCount || 0) - 1) : (p.likeCount || 0) + 1,
        };
        return old.post ? { ...old, post: updated } : updated;
      });
      return { previousPost };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', id], context.previousPost);
      }
      toast.error('Failed to like post');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['post', id] }),
  });

  const addCommentMutation = useAddComment(id, user);

  if (isLoading || !post) return <PageSpinner />;

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Post */}
        <div className="mb-8">
          {post.pinned && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full w-fit mb-3">
              <Pin className="w-3 h-3" />
              Pinned
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar src={post.author.avatar} name={post.author.name} size="md" />
              <div>
                <span className="font-semibold text-gray-900 text-sm">{post.author.name}</span>
                <span className="text-gray-400 text-sm ml-2">{timeAgo(post.createdAt)}</span>
              </div>
            </div>
            <PostActionMenu
              post={post}
              isAuthor={isAuthor}
              isModerator={isModerator}
              onEdit={() => setEditingPost(true)}
              onDelete={() => setShowDeleteConfirm(true)}
              onTogglePin={() => togglePinMutation.mutate(post.id, {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: ['post', id] });
                  toast.success(post.pinned ? 'Post unpinned' : 'Post pinned');
                },
              })}
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">{post.title}</h1>
          <RichContent content={post.content} />

          <div className="flex gap-5 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                if (!user) { toast.error('Sign in to like'); return; }
                toggleLikeMutation.mutate();
              }}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className="w-[18px] h-[18px]" fill={post.isLiked ? 'currentColor' : 'none'} />
              {post.likeCount}
            </button>
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <MessageCircle className="w-[18px] h-[18px]" />
              {post.commentCount} comments
            </span>
          </div>
        </div>

        {/* Add comment */}
        {user && (
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <Avatar src={user.avatar} name={user.name} size="sm" className="mt-1" />
              <div className="flex-1">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none transition-colors"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    disabled={!commentContent.trim()}
                    isLoading={addCommentMutation.isPending}
                    onClick={() => {
                      if (!commentContent.trim()) return;
                      addCommentMutation.mutate(
                        { content: commentContent.trim() },
                        {
                          onSuccess: () => { setCommentContent(''); toast.success('Comment added'); },
                        }
                      );
                    }}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!user && (
          <p className="text-gray-400 text-sm mb-6">Sign in to comment.</p>
        )}

        {/* Comments */}
        <div id="comments" className="space-y-0 scroll-mt-24">
          {post.comments?.length ? (
            post.comments.map((comment) => (
              <div key={comment.id} className="py-4 border-b border-gray-100 last:border-0">
                <div className="flex gap-3">
                  <Avatar src={comment.author.avatar} name={comment.author.name} size="sm" className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{comment.author.name}</span>
                      <span className="text-gray-400 text-xs">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1 leading-relaxed">{comment.content}</p>

                    {user && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-xs text-gray-500 hover:text-gray-900 font-medium mt-2"
                      >
                        Reply
                      </button>
                    )}

                    {replyingTo === comment.id && user && (
                      <div className="mt-3 flex items-start gap-2">
                        <Avatar src={user.avatar} name={user.name} size="xs" className="mt-1" />
                        <div className="flex-1">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none transition-colors"
                          />
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" disabled={!replyContent.trim()} isLoading={addCommentMutation.isPending}
                              onClick={() => {
                                if (!replyContent.trim()) return;
                                addCommentMutation.mutate(
                                  { content: replyContent.trim(), parentId: comment.id },
                                  {
                                    onSuccess: () => { setReplyingTo(null); setReplyContent(''); },
                                  }
                                );
                              }}
                            >
                              Reply
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyContent(''); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {comment.replies?.length > 0 && (
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2.5">
                            <Avatar src={reply.author.avatar} name={reply.author.name} size="xs" className="mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 text-xs">{reply.author.name}</span>
                                <span className="text-gray-400 text-xs">{timeAgo(reply.createdAt)}</span>
                              </div>
                              <p className="text-gray-700 text-sm mt-0.5">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>
            </div>
          )}
        </div>
      </div>

      {editingPost && post && (
        <EditPostModal
          post={post}
          isPending={updatePostMutation.isPending}
          onClose={() => setEditingPost(false)}
          onSave={(data) => updatePostMutation.mutate(data, {
            onSuccess: () => {
              setEditingPost(false);
              queryClient.invalidateQueries({ queryKey: ['post', id] });
              toast.success('Post updated');
            },
          })}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          isPending={deletePostMutation.isPending}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => deletePostMutation.mutate(post.id, {
            onSuccess: () => {
              setShowDeleteConfirm(false);
              toast.success('Post deleted');
              navigate(-1);
            },
          })}
        />
      )}
    </div>
  );
}
