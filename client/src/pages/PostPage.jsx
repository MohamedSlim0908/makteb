import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { PageSpinner } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PostPage() {
  const { id } = useParams();
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${id}`);
      return data.post;
    },
    enabled: !!id,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: () => api.post(`/posts/${id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post', id] }),
    onError: () => toast.error('Failed to like post'),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content) => api.post(`/posts/${id}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      setCommentContent('');
      toast.success('Comment added');
    },
    onError: () => toast.error('Failed to add comment'),
  });

  const addReplyMutation = useMutation({
    mutationFn: ({ commentId, content }) =>
      api.post(`/posts/${id}/comments`, { content, parentId: commentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      setReplyingTo(null);
      setReplyContent('');
      toast.success('Reply added');
    },
    onError: () => toast.error('Failed to add reply'),
  });

  if (isLoading || !post) return <PageSpinner />;

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5f5]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Post */}
        <Card className="mb-8">
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{post.title}</h1>

            <div className="flex items-center gap-3 mt-4">
              <Avatar src={post.author.avatar} name={post.author.name} size="md" />
              <div>
                <span className="font-medium text-gray-900 text-sm">{post.author.name}</span>
                <span className="text-gray-400 text-sm ml-2">{formatDate(post.createdAt)}</span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>

            <div className="flex gap-6 mt-6 pt-5 border-t border-gray-100">
              <button
                onClick={() => {
                  if (!user) { toast.error('Sign in to like'); return; }
                  toggleLikeMutation.mutate();
                }}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  post.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className="w-[18px] h-[18px]" fill={post.isLiked ? 'currentColor' : 'none'} />
                {post.likeCount}
              </button>
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <MessageCircle className="w-[18px] h-[18px]" />
                {post.commentCount} comments
              </span>
            </div>
          </div>
        </Card>

        {/* Comments */}
        <h2 className="text-base font-semibold text-gray-900 mb-4">Comments</h2>

        {user && (
          <Card className="mb-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commentContent.trim()) return;
                addCommentMutation.mutate(commentContent.trim());
              }}
              className="p-4"
            >
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-colors"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentContent.trim()}
                  isLoading={addCommentMutation.isPending}
                >
                  Post Comment
                </Button>
              </div>
            </form>
          </Card>
        )}

        {!user && (
          <p className="text-gray-400 text-sm mb-6">Sign in to comment.</p>
        )}

        <div className="space-y-4">
          {post.comments?.length ? (
            post.comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex gap-3">
                  <Avatar src={comment.author.avatar} name={comment.author.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">{comment.author.name}</span>
                      <span className="text-gray-400 text-xs">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">{comment.content}</p>

                    {user && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-2"
                      >
                        Reply
                      </button>
                    )}

                    {replyingTo === comment.id && user && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!replyContent.trim()) return;
                          addReplyMutation.mutate({ commentId: comment.id, content: replyContent.trim() });
                        }}
                        className="mt-3"
                      >
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-colors"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button type="submit" size="sm" disabled={!replyContent.trim()} isLoading={addReplyMutation.isPending}>
                            Reply
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyContent(''); }}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}

                    {comment.replies?.length > 0 && (
                      <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-100">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar src={reply.author.avatar} name={reply.author.name} size="sm" />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900 text-xs">{reply.author.name}</span>
                                <span className="text-gray-400 text-xs">{formatDate(reply.createdAt)}</span>
                              </div>
                              <p className="text-gray-600 text-sm mt-0.5">{reply.content}</p>
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
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
