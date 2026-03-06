import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'WINS', label: 'Wins' },
  { value: 'WORKFLOW_PRODUCTIVITY', label: 'Resources' },
  { value: 'INTRODUCE_YOURSELF', label: 'Introduce Yourself' },
];

export function EditPostModal({ post, onSave, onClose, isPending }) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState(post.category || 'GENERAL');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({ postId: post.id, title: title.trim(), content: content.trim(), category });
  }

  return (
    <Modal isOpen onClose={onClose} title="Edit Post">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Write your post..."
            className="w-full px-3 py-2 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none transition-all duration-150"
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm bg-white text-gray-900 border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-150"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isPending}
            disabled={!title.trim() || !content.trim()}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
