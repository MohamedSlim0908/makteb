import { Heart, MessageCircle, Pin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const CATEGORY_LABELS = {
  GENERAL: 'General',
  WINS: 'Wins',
  BRANDING_CLIENTS: 'Branding / Clients',
  WORKFLOW_PRODUCTIVITY: 'Workflow / Productivity',
  BANTER: 'Banter',
  INTRODUCE_YOURSELF: 'Introduce Yourself',
};

export function PostCard({ post, onToggleLike, likePending }) {
  return (
    <article className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar src={post.author?.avatar} name={post.author?.name} size="sm" />
          <div>
            <p className="font-semibold text-gray-900">{post.author?.name}</p>
            <p className="text-xs text-gray-500">
              {formatDate(post.createdAt)} · {CATEGORY_LABELS[post.category] || 'General'}
            </p>
          </div>
        </div>
        {post.pinned && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <Pin className="w-3.5 h-3.5" />
            Pinned
          </span>
        )}
      </div>

      <Link to={`/post/${post.id}`} className="block mt-3">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
        <p className="text-sm text-gray-700 leading-6 whitespace-pre-wrap line-clamp-4">{post.content}</p>
      </Link>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4">
        <button
          type="button"
          onClick={() => onToggleLike(post.id)}
          disabled={likePending}
          className={`inline-flex items-center gap-1.5 text-sm ${
            post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
          } disabled:opacity-60`}
        >
          <Heart className="w-4 h-4" fill={post.isLiked ? 'currentColor' : 'none'} />
          <span>{post.likeCount}</span>
        </button>
        <Link to={`/post/${post.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600">
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount}</span>
        </Link>
      </div>
    </article>
  );
}
