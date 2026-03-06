import { Heart, MessageCircle } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

export function PostCard({ post }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <Avatar name={post.authorName} src={post.authorAvatar} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{post.authorName}</p>
            <span className="text-xs text-gray-400">{post.createdAtLabel}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{post.content}</p>

          {post.mediaLabel && (
            <div className="mt-3 h-36 rounded-lg border border-gray-200 bg-gray-100 text-sm text-gray-500 flex items-center justify-center">
              {post.mediaLabel}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <button type="button" className="inline-flex items-center gap-1.5 hover:text-gray-700">
              <Heart className="h-4 w-4" />
              Like
            </button>
            <button type="button" className="inline-flex items-center gap-1.5 hover:text-gray-700">
              <MessageCircle className="h-4 w-4" />
              Comment
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
