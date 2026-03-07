import { Heart, MessageCircle, Pin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { PostActionMenu } from './PostActionMenu';
import { RichContent } from '../ui/RichContent';

function timeAgo(value) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const CATEGORY_LABELS = {
  GENERAL: 'General',
  WINS: 'Wins',
  BRANDING_CLIENTS: 'Branding / Clients',
  WORKFLOW_PRODUCTIVITY: 'Workflow / Productivity',
  BANTER: 'Banter',
  INTRODUCE_YOURSELF: 'Introduce Yourself',
};

const MODERATOR_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

export function PostCard({ post, onToggleLike, likePending, currentUserId, memberRole, onEdit, onDelete, onTogglePin }) {
  const isAuthor = currentUserId && (post.authorId === currentUserId || post.author?.id === currentUserId);
  const isModerator = MODERATOR_ROLES.includes(memberRole);
  const postUrl = `/post/${post.id}`;
  const commentsUrl = `${postUrl}#comments`;

  return (
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
      <div className="p-5">
        {/* Author row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={post.author?.avatar} name={post.author?.name} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{post.author?.name}</span>
                <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
              </div>
              <span className="text-xs text-gray-500">{CATEGORY_LABELS[post.category] || 'General'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.pinned && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                <Pin className="w-3 h-3" />
                Pinned
              </span>
            )}
            <PostActionMenu
              post={post}
              isAuthor={isAuthor}
              isModerator={isModerator}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePin={onTogglePin}
            />
          </div>
        </div>

        {/* Content */}
        <Link to={postUrl} className="group block">
          <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-gray-700 transition-colors">
            {post.title}
          </h3>
        </Link>
        <RichContent content={post.content} preview className="mt-2" />
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-4">
        <button
          type="button"
          onClick={() => onToggleLike(post.id)}
          disabled={likePending}
          className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
            post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          } disabled:opacity-60`}
        >
          <Heart className="w-4 h-4" fill={post.isLiked ? 'currentColor' : 'none'} />
          <span>{post.likeCount || 0}</span>
        </button>
        <Link to={commentsUrl} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount || 0}</span>
        </Link>
      </div>
    </article>
  );
}
