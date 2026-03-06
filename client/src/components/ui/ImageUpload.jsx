import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export function ImageUpload({ onUpload, currentImage, className = '', label = 'Upload image' }) {
  const [preview, setPreview] = useState(currentImage || '');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data.url);
      onUpload?.(data.url);
      toast.success('Image uploaded');
    } catch {
      setPreview(currentImage || '');
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    setPreview('');
    onUpload?.('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label={label}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors bg-gray-50 flex items-center justify-center group"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-6 h-6 text-gray-400 group-hover:text-gray-500 transition-colors" />
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
          <Camera className="w-5 h-5 text-white" />
        </div>

        {/* Loading spinner */}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </button>

      {/* Clear button */}
      {preview && !uploading && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute -top-1 -right-1 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      )}

      <p className="text-xs text-gray-500 mt-1.5 text-center">{label}</p>
    </div>
  );
}
