import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2, Pin, PinOff } from 'lucide-react';

export function PostActionMenu({ post, isAuthor, isModerator, onEdit, onDelete, onTogglePin }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Click outside handler
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!isAuthor && !isModerator) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
          {isAuthor && (
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
          {isModerator && (
            <button
              onClick={() => { onTogglePin(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {post.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              {post.pinned ? 'Unpin' : 'Pin'}
            </button>
          )}
          {(isAuthor || isModerator) && (
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
