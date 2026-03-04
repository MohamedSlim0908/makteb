import { Image, Link2, Video } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { POST_CATEGORIES } from './mockData';

export function PostComposer({
  user,
  title,
  content,
  category,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onSubmit,
  isSubmitting,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-gray-200 rounded-xl p-3"
    >
      <div className="flex items-start gap-3">
        <Avatar src={user?.avatar} name={user?.name} size="md" />
        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Write something"
            className="w-full text-base px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Share your thoughts with the course community..."
            rows={4}
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <button type="button" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100">
            <Image className="w-4 h-4" /> Add image
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100">
            <Video className="w-4 h-4" /> Add video
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100">
            <Link2 className="w-4 h-4" /> Add link
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-9 rounded-md border border-gray-200 px-2 text-sm bg-white"
          >
            {POST_CATEGORIES.filter((item) => item.value !== 'ALL').map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Post
          </Button>
        </div>
      </div>
    </form>
  );
}
