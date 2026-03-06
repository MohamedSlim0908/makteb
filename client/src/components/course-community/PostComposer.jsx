import { useState, useRef } from 'react';
import { Image, Link2, Video, X, Loader2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { POST_CATEGORIES } from './mockData';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

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
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleRemoveImage() {
    setImageUrl('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Append image URL to content if one was uploaded
    const finalContent = imageUrl ? `${content}\n\n![image](${imageUrl})` : content;
    onContentChange(finalContent);
    // Use a microtask so the content state updates before submit
    setTimeout(() => {
      onSubmit(e, imageUrl);
      setImageUrl('');
    }, 0);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar src={user?.avatar} name={user?.name} size="md" />
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Title"
              className="w-full text-base font-semibold px-0 py-1 border-0 focus:outline-none focus:ring-0 placeholder-gray-400"
              required
            />
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Write something..."
              rows={3}
              className="w-full text-sm px-0 py-1 border-0 resize-none focus:outline-none focus:ring-0 placeholder-gray-400"
              required
            />

            {/* Image preview */}
            {imageUrl && (
              <div className="relative inline-block mt-2">
                <img
                  src={imageUrl}
                  alt="Attached"
                  className="max-h-40 rounded-lg border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Upload loading state */}
            {imageUploading && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading image...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="px-4 py-3 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gray-50/50">
        <div className="flex items-center gap-1 text-gray-500">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={imageUploading}
            className="inline-flex items-center gap-1 p-2 rounded-lg hover:bg-gray-100 text-xs disabled:opacity-50"
          >
            <Image className="w-4 h-4" />
          </button>
          <button type="button" className="inline-flex items-center gap-1 p-2 rounded-lg hover:bg-gray-100 text-xs">
            <Video className="w-4 h-4" />
          </button>
          <button type="button" className="inline-flex items-center gap-1 p-2 rounded-lg hover:bg-gray-100 text-xs">
            <Link2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-8 rounded-lg border border-gray-200 px-2 text-xs bg-white font-medium"
          >
            {POST_CATEGORIES.filter((item) => item.value !== 'ALL').map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" isLoading={isSubmitting} disabled={imageUploading}>
            Post
          </Button>
        </div>
      </div>
    </form>
  );
}
