import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiHeart, HiChat } from 'react-icons/hi';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface Post {
  id: string;
  title: string;
  content: string;
  author: { id: string; name: string; avatar: string | null };
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked?: boolean;
  comments?: Comment[];
}

interface Comment {
  id: string;
  content: string;
  author: { id: string; name: string; avatar: string | null };
  createdAt: string;
  replies?: Comment[];
}

export function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data } = await api.get<Post>(`/posts/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/posts/${id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
    onError: () => toast.error('Failed to like'),
  });

  const unlikeMutation = useMutation({
    mutationFn: () => api.delete(`/posts/${id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
    onError: () => toast.error('Failed to unlike'),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/posts/${id}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      setCommentContent('');
      toast.success('Comment added');
    },
    onError: () => toast.error('Failed to add comment'),
  });

  const addReplyMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      api.post(`/posts/${id}/comments`, { content, parentId: commentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      setReplyingTo(null);
      setReplyContent('');
      toast.success('Reply added');
    },
    onError: () => toast.error('Failed to add reply'),
  });

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentContent.trim() || !user) return;
    addCommentMutation.mutate(commentContent.trim());
  }

  function handleSubmitReply(e: React.FormEvent, commentId: string) {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;
    addReplyMutation.mutate({ commentId, content: replyContent.trim() });
  }

  function toggleLike() {
    if (!user) {
      toast.error('Sign in to like');
      return;
    }
    if (post?.isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  }

  if (isLoading || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <article className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{post.title}</h1>
          <div className="flex items-center gap-3 mt-4">
            <Avatar src={post.author.avatar} name={post.author.name} size="md" />
            <div>
              <span className="font-medium text-gray-900">{post.author.name}</span>
              <span className="text-gray-500 text-sm ml-2">{formatDate(post.createdAt)}</span>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-gray-600 whitespace-pre-wrap">{post.content}</p>
          </div>
          <div className="flex gap-6 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <HiHeart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
              {post.likeCount}
            </button>
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <HiChat className="w-5 h-5" />
              {post.commentCount} comments
            </span>
          </div>
        </article>

        {/* Comments section */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>

          {user && (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
              <Button
                type="submit"
                size="sm"
                className="mt-2"
                disabled={!commentContent.trim()}
                isLoading={addCommentMutation.isPending}
              >
                Post Comment
              </Button>
            </form>
          )}

          {!user && (
            <p className="text-gray-500 text-sm mb-6">Sign in to comment.</p>
          )}

          <div className="space-y-6">
            {post.comments?.length ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex gap-3">
                    <Avatar src={comment.author.avatar} name={comment.author.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{comment.author.name}</span>
                        <span className="text-gray-500 text-sm">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{comment.content}</p>
                      {user && (
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-sm text-primary-600 hover:text-primary-700 mt-2"
                        >
                          Reply
                        </button>
                      )}
                      {replyingTo === comment.id && user && (
                        <form
                          onSubmit={(e) => handleSubmitReply(e, comment.id)}
                          className="mt-3"
                        >
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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
                      {comment.replies?.length ? (
                        <div className="mt-4 space-y-4 ml-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3">
                              <Avatar src={reply.author.avatar} name={reply.author.name} size="sm" />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-gray-900 text-sm">{reply.author.name}</span>
                                  <span className="text-gray-500 text-xs">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="text-gray-600 text-sm mt-0.5">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm py-4">No comments yet. Be the first!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
